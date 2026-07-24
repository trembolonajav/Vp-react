import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import websocket


DEBUG_PORT = 9223
TARGET_HOST = "poke.idleworld.online"
OUT = Path(__file__).with_name("poke_assets_capture.jsonl")
STOP = Path(__file__).with_name("poke_assets_capture.stop")


def redact_text(value):
    if not isinstance(value, str):
        return value
    value = re.sub(r"([?&]token=)[^&\s]+", r"\1[REDACTED]", value, flags=re.I)
    value = re.sub(r'("(?:accessToken|refreshToken|token)"\s*:\s*")[^"]+', r"\1[REDACTED]", value, flags=re.I)
    value = re.sub(r'("(?:password|email|recoveryKey|code)"\s*:\s*")[^"]+', r"\1[REDACTED]", value, flags=re.I)
    value = re.sub(r"(Authorization\s*[:=]\s*Bearer\s+)[^\s,\"}]+", r"\1[REDACTED]", value, flags=re.I)
    return value


def redact_obj(value):
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key.lower() in {"authorization", "cookie", "set-cookie", "accesstoken", "refreshtoken", "token", "password", "email", "recoverykey", "code"}:
                result[key] = "[REDACTED]"
            else:
                result[key] = redact_obj(item)
        return result
    if isinstance(value, list):
        return [redact_obj(item) for item in value]
    return redact_text(value)


def targets():
    with urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json", timeout=2) as response:
        return json.load(response)


def choose_target():
    while not STOP.exists():
        try:
            pages = [t for t in targets() if t.get("type") == "page"]
            game = next((t for t in pages if TARGET_HOST in t.get("url", "")), None)
            if game:
                return game
        except Exception:
            pass
        time.sleep(1)
    return None


def write(event):
    event["capturedAt"] = datetime.now(timezone.utc).isoformat()
    with OUT.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(redact_obj(event), ensure_ascii=False) + "\n")


def capture(target):
    ws = websocket.create_connection(target["webSocketDebuggerUrl"], timeout=2, origin=f"http://127.0.0.1:{DEBUG_PORT}")
    ws.send(json.dumps({"id": 1, "method": "Network.enable", "params": {"maxTotalBufferSize": 100000000}}))
    write({"kind": "capture-start", "page": target.get("url")})
    while not STOP.exists():
        try:
            raw = ws.recv()
        except Exception:
            break
        try:
            message = json.loads(raw)
        except Exception:
            continue
        method = message.get("method", "")
        params = message.get("params", {})
        if method in {"Network.webSocketCreated", "Network.webSocketClosed", "Network.webSocketFrameReceived", "Network.webSocketFrameSent"}:
            write({"kind": method, "data": params})
        elif method in {"Network.requestWillBeSent", "Network.responseReceived"}:
            blob = json.dumps(params, ensure_ascii=False)
            if TARGET_HOST in blob or "/api/game/" in blob or "/game/" in blob:
                write({"kind": method, "data": params})
    try:
        ws.close()
    except Exception:
        pass


def main():
    STOP.unlink(missing_ok=True)
    OUT.unlink(missing_ok=True)
    while not STOP.exists():
        target = choose_target()
        if not target:
            break
        try:
            capture(target)
        except Exception as exc:
            write({"kind": "capture-error", "error": str(exc)})
        time.sleep(1)
    write({"kind": "capture-stop"})


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)

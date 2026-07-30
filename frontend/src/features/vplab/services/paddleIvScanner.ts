import { PaddleOCR } from "@paddleocr/paddleocr-js";
import type { OcrResultItem } from "@paddleocr/paddleocr-js";
import type { IvScanFields, IvScanResult } from "../types/ivScanner";
import { EMPTY_IV_SCAN } from "../types/ivScanner";

const MODEL_ROOT = "/ocr-models";
let enginePromise: ReturnType<typeof PaddleOCR.create> | null = null;

function engine() {
  enginePromise ??= PaddleOCR.create({
    textDetectionModelName: "PP-OCRv6_tiny_det",
    textDetectionModelAsset: {
      url: `${MODEL_ROOT}/PP-OCRv6_tiny_det_onnx_infer.tar`,
    },
    textRecognitionModelName: "PP-OCRv6_tiny_rec",
    textRecognitionModelAsset: {
      url: `${MODEL_ROOT}/PP-OCRv6_tiny_rec_onnx_infer.tar`,
    },
    textRecognitionBatchSize: 8,
    ortOptions: {
      backend: "wasm",
      numThreads: 1,
      simd: true,
    },
  });
  return enginePromise;
}

const digits = (value: string | undefined) =>
  (value ?? "")
    .replace(/[oO]/g, "0")
    .replace(/[iIl!|]/g, "1")
    .replace(/[^0-9]/g, "");

const clean = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function linesFrom(items: OcrResultItem[]): string[] {
  const rows: Array<{ center: number; height: number; items: OcrResultItem[] }> = [];
  const sorted = [...items].sort((a, b) => {
    const ay = a.poly.reduce((sum, point) => sum + point[1], 0) / a.poly.length;
    const by = b.poly.reduce((sum, point) => sum + point[1], 0) / b.poly.length;
    return ay - by;
  });

  for (const item of sorted) {
    const ys = item.poly.map((point) => point[1]);
    const center = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const height = Math.max(...ys) - Math.min(...ys);
    const row = rows.find((candidate) =>
      Math.abs(candidate.center - center) <= Math.max(5, Math.min(candidate.height, height) * 0.65));
    if (row) {
      row.items.push(item);
      row.center = (row.center + center) / 2;
      row.height = Math.max(row.height, height);
    } else {
      rows.push({ center, height, items: [item] });
    }
  }

  return rows
    .sort((a, b) => a.center - b.center)
    .map((row) => row.items
      .sort((a, b) => Math.min(...a.poly.map((point) => point[0])) -
        Math.min(...b.poly.map((point) => point[0])))
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join(" "));
}

function labeledInteger(text: string, labels: string[], maximum = 9_999_999): string {
  const normalized = clean(text);
  for (const label of labels) {
    const match = normalized.match(new RegExp(`(?:^|\\s)${label}[^0-9]{0,12}([0-9oOil!|][0-9oOil!|.,]*)`, "im"));
    const value = Number(digits(match?.[1]));
    if (value > 0 && value <= maximum) return String(value);
  }
  return "";
}

export function parsePokeIdleText(rawText: string): IvScanFields {
  const normalized = clean(rawText).replace(/[×✕]/g, "x");
  const levelMatch = normalized.match(/(?:nv|nivel|lvl)\s*[:.]?\s*([0-9oOil!|]{1,4})/i);
  const qualityMatch = normalized.match(
    /(?:qualidade[^\n0-9]{0,24}|(?:lendaria|mitica|epica|rara|incomum)[^\n]{0,18}?x\s*|(?:^|\s)x\s*)([0-9][.,][0-9]{1,3})/im,
  );
  const ivMatch = normalized.match(/(?:iv|1v)\s*([0-9oOil!|]{1,3})\s*[/|]\s*(192)/i);
  const powerMatch =
    normalized.match(/(?:poder|power)[^0-9]{0,8}([0-9][0-9.,]*)/i) ??
    normalized.match(/([0-9][0-9.,]*)[^0-9\n]{0,5}(?:poder|power)/i);
  const species =
    rawText.split(/\r?\n/).map((line) => line.trim())
      .find((line) => /^[A-Za-zÀ-ÿ♀♂.' -]{3,24}$/.test(line) &&
        !/^(qualidade|lendária|mítica|épica|rara|ativo|poder)$/i.test(line)) ?? "";

  return {
    ...EMPTY_IV_SCAN,
    species,
    level: digits(levelMatch?.[1]),
    quality: qualityMatch?.[1]?.replace(",", ".") ?? "",
    ivTotal: digits(ivMatch?.[1]),
    ivMaximum: ivMatch ? "192" : "",
    power: digits(powerMatch?.[1]),
    stats: [
      labeledInteger(rawText, ["hp"]),
      labeledInteger(rawText, ["atk", "ataque"]),
      labeledInteger(rawText, ["def", "defesa"]),
      labeledInteger(rawText, ["spa", "sp[ah]", "atq\\.?\\s*esp"]),
      labeledInteger(rawText, ["spd", "sp[dpob]", "def\\.?\\s*esp"]),
      labeledInteger(rawText, ["vel", "velocidade"]),
    ],
  };
}

export async function scanPokeIdleImage(file: File): Promise<IvScanResult> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  const ocr = await engine();
  const [result] = await ocr.predict(file, {
    textDetLimitSideLen: 1216,
    textDetLimitType: "max",
    textRecScoreThresh: 0.25,
  });
  if (!result) throw new Error("O leitor não retornou resultado.");

  const lines = linesFrom(result.items);
  const rawText = lines.join("\n");
  const confidence = result.items.length
    ? result.items.reduce((sum, item) => sum + item.score, 0) / result.items.length
    : 0;

  return {
    fields: parsePokeIdleText(rawText),
    rawText,
    confidence,
    elapsedMs: result.metrics.totalMs,
    engine: "PaddleOCR PP-OCRv6",
  };
}

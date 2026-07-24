"""Separa a prancha de tipos e copia os painéis da Rota de Caça.

Uso: python scripts/split-route-assets.py <prancha> <card> <positivo> <alerta>
"""
from pathlib import Path
import sys

from PIL import Image


TYPE_NAMES = (
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy",
)


def alpha_trim(image: Image.Image, padding: int = 8) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("recorte sem pixels visíveis")
    left, top, right, bottom = bbox
    return image.crop((
        max(0, left - padding), max(0, top - padding),
        min(image.width, right + padding), min(image.height, bottom + padding),
    ))


def icon_bottom(cell: Image.Image) -> int:
    """Encontra o vão transparente que separa o símbolo de seu rótulo."""
    alpha = cell.getchannel("A")
    rows = [alpha.crop((0, y, cell.width, y + 1)).getbbox() is not None for y in range(cell.height)]
    start = int(cell.height * 0.42)
    stop = int(cell.height * 0.84)
    run = 0
    for y in range(start, stop):
        run = 0 if rows[y] else run + 1
        if run >= 8:
            return y - run + 1
    return int(cell.height * 0.72)


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit(__doc__)
    sheet_path, card_path, positive_path, warning_path = map(Path, sys.argv[1:])
    output = Path("apps/vpertz-lab/public/assets/route")
    types_output = output / "types"
    types_output.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(sheet_path).convert("RGBA")
    cell_w, cell_h = sheet.width / 6, sheet.height / 3
    for index, name in enumerate(TYPE_NAMES):
        row, col = divmod(index, 6)
        left, right = round(col * cell_w), round((col + 1) * cell_w)
        top = round(row * cell_h)
        cell = sheet.crop((left, top, right, round((row + 1) * cell_h)))
        icon = alpha_trim(cell.crop((0, 0, cell.width, icon_bottom(cell))))
        icon.save(types_output / f"{name}.png", optimize=True)

    for source, filename in (
        (card_path, "hunt-card-frame.png"),
        (positive_path, "positive-panel.png"),
        (warning_path, "warning-panel.png"),
    ):
        panel = Image.open(source).convert("RGBA")
        alpha_trim(panel, padding=0).save(output / filename, optimize=True)

    print(f"18 ícones e 3 painéis salvos em {output}")


if __name__ == "__main__":
    main()

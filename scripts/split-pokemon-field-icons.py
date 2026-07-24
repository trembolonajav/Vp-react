"""Separa a prancha 4x4 de ícones dos campos de Pokémon.

Exporta 16 PNGs RGBA de 256x256 e um manifest.json com a nomenclatura.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

from PIL import Image, ImageFilter


ICONS = (
    ("01-nivel.png", "Nível"),
    ("02-genero.png", "Gênero"),
    ("03-natureza.png", "Natureza"),
    ("04-iv-total.png", "IV Total"),
    ("05-habilidade.png", "Habilidade"),
    ("06-forma.png", "Forma"),
    ("07-golpes.png", "Moves / Golpes"),
    ("08-servidor.png", "Servidor"),
    ("09-hp-iv.png", "HP IV"),
    ("10-ataque-iv.png", "Ataque IV"),
    ("11-defesa-iv.png", "Defesa IV"),
    ("12-ataque-especial-iv.png", "Ataque Especial IV"),
    ("13-defesa-especial-iv.png", "Defesa Especial IV"),
    ("14-velocidade-iv.png", "Velocidade IV"),
    ("15-raridade-shiny.png", "Raridade / Shiny"),
    ("16-disponivel-troca.png", "Disponível para / Troca"),
)


def remove_dark_background(image: Image.Image) -> Image.Image:
    """Converte o fundo preto em alpha e descontamina as bordas douradas."""
    source = image.convert("RGB")
    output = Image.new("RGBA", source.size)
    converted = []

    for red, green, blue in source.getdata():
        value = max(red, green, blue)
        gold = red - blue

        # O fundo/textura é quase neutro; o objeto é quente e dourado.
        if value < 25 or (value < 50 and gold < 12) or (value < 76 and gold < 7):
            converted.append((0, 0, 0, 0))
            continue

        light_alpha = (value - 22) * 255 / 105
        gold_alpha = (gold - 7) * 255 / 46
        alpha = max(0, min(255, round(max(light_alpha, gold_alpha))))
        if alpha == 0:
            converted.append((0, 0, 0, 0))
            continue

        # A imagem original está composta sobre preto. Recuperar a cor antes
        # da composição evita halos escuros quando usada sobre fundos claros.
        target_value = min(255, round(value * 255 / alpha)) if alpha < 255 else value
        factor = target_value / value
        converted.append((
            min(255, round(red * factor)),
            min(255, round(green * factor)),
            min(255, round(blue * factor)),
            alpha,
        ))

    output.putdata(converted)
    alpha = output.getchannel("A")
    seed = Image.new("L", source.size)
    seed.putdata([
        255 if max(red, green, blue) >= 92
        and (red - blue >= 12 or max(red, green, blue) >= 145)
        else 0
        for red, green, blue in source.getdata()
    ])

    # Descarta grãos isolados da textura original, preservando os brilhos
    # intencionais (que formam componentes maiores ao redor de cada símbolo).
    width, height = seed.size
    pixels = seed.load()
    visited = bytearray(width * height)
    kept = Image.new("L", seed.size)
    kept_pixels = kept.load()
    for start_y in range(height):
        for start_x in range(width):
            offset = start_y * width + start_x
            if visited[offset] or not pixels[start_x, start_y]:
                continue
            stack = [(start_x, start_y)]
            visited[offset] = 1
            component = []
            while stack:
                x, y = stack.pop()
                component.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < width and 0 <= ny < height:
                        neighbor = ny * width + nx
                        if not visited[neighbor] and pixels[nx, ny]:
                            visited[neighbor] = 1
                            stack.append((nx, ny))
            if len(component) >= 10:
                for x, y in component:
                    kept_pixels[x, y] = 255

    kept = kept.filter(ImageFilter.MaxFilter(7))
    alpha = Image.composite(alpha, Image.new("L", alpha.size), kept)
    output.putalpha(alpha)
    return output


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Uso: python scripts/split-pokemon-field-icons.py <prancha.png> [saída]")

    source_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) == 3 else Path(
        "apps/vpertz-lab/public/assets/pokemon-fields"
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(source_path).convert("RGB")
    cell_width = sheet.width / 4
    cell_height = sheet.height / 4
    margin = round(min(cell_width, cell_height) * 0.105)

    manifest = []
    for index, (filename, label) in enumerate(ICONS):
        row, column = divmod(index, 4)
        left = round(column * cell_width) + margin
        top = round(row * cell_height) + margin
        right = round((column + 1) * cell_width) - margin
        bottom = round((row + 1) * cell_height) - margin

        icon = sheet.crop((left, top, right, bottom))
        icon = remove_dark_background(icon)
        icon = icon.resize((256, 256), Image.Resampling.LANCZOS)
        icon.save(output_dir / filename, optimize=True)

        manifest.append({
            "index": index + 1,
            "label": label,
            "file": filename,
            "width": 256,
            "height": 256,
        })

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(ICONS)} ícones transparentes salvos em {output_dir}")


if __name__ == "__main__":
    main()

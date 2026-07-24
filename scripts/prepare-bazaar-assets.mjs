/* Prepara as artes do card do VP Bazaar.

   As exportações originais vêm sem canal alfa: o xadrez de "transparência"
   está rasterizado como pixels reais. Aqui recuperamos o alfa por flood fill
   a partir das bordas (só o fundo conectado à borda é removido, então brilhos
   claros no meio da placa sobrevivem), recortamos na arte e gravamos WebP.

   Uso: node scripts/prepare-bazaar-assets.mjs <pasta-de-origem>
   As artes de origem não são versionadas; o resultado vai para
   apps/vpertz-store/public/assets/bazaar/. */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ORIGEM = process.argv[2] || "C:/Users/gabri/Downloads";
const DESTINO = path.join(process.cwd(), "apps", "vpertz-store", "public", "assets", "bazaar");

const ARTES = [
  { arquivo: "ChatGPT Image 22 de jul. de 2026, 21_23_27.png", nome: "card-frame", largura: 620 },
  { arquivo: "ChatGPT Image 22 de jul. de 2026, 21_23_32.png", nome: "botao-anuncio", largura: 620 },
  { arquivo: "ChatGPT Image 22 de jul. de 2026, 21_23_38.png", nome: "placa-destaque", largura: 460 },
  { arquivo: "ChatGPT Image 22 de jul. de 2026, 21_23_43.png", nome: "placa-shiny", largura: 460 }
];

/* O xadrez é neutro (R≈G≈B) e claro; a arte é colorida ou escura. */
const ehFundo = (r, g, b) =>
  Math.max(r, g, b) - Math.min(r, g, b) < 26 && Math.min(r, g, b) > 176;

async function recuperarAlfa(entrada) {
  const { data, info } = await sharp(entrada)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: ch } = info;
  const fundo = new Uint8Array(w * h);
  const fila = [];

  /* semeia a fila com os pixels de borda que parecem fundo */
  const visitar = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (fundo[i]) return;
    const p = i * ch;
    if (!ehFundo(data[p], data[p + 1], data[p + 2])) return;
    fundo[i] = 1;
    fila.push(i);
  };

  for (let x = 0; x < w; x++) { visitar(x, 0); visitar(x, h - 1); }
  for (let y = 0; y < h; y++) { visitar(0, y); visitar(w - 1, y); }

  /* flood fill 4-vizinhos: só o fundo conectado à borda vira transparente */
  for (let cursor = 0; cursor < fila.length; cursor++) {
    const i = fila[cursor];
    const x = i % w;
    const y = (i - x) / w;
    visitar(x - 1, y); visitar(x + 1, y);
    visitar(x, y - 1); visitar(x, y + 1);
  }

  let removidos = 0;
  for (let i = 0; i < w * h; i++) {
    if (fundo[i]) { data[i * ch + 3] = 0; removidos++; }
  }

  return {
    imagem: sharp(data, { raw: { width: w, height: h, channels: ch } }),
    proporcaoRemovida: removidos / (w * h)
  };
}

await fs.mkdir(DESTINO, { recursive: true });

for (const arte of ARTES) {
  const entrada = path.join(ORIGEM, arte.arquivo);
  const { imagem, proporcaoRemovida } = await recuperarAlfa(entrada);
  const saida = path.join(DESTINO, `${arte.nome}.webp`);

  await imagem
    .png()                                   // materializa o alfa antes do trim
    .toBuffer()
    .then((buf) => sharp(buf)
      .trim({ threshold: 0 })                // recorta a moldura transparente
      .resize({ width: arte.largura, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6, alphaQuality: 100 })
      .toFile(saida));

  const { size } = await fs.stat(saida);
  const meta = await sharp(saida).metadata();
  console.log(
    `${arte.nome.padEnd(16)} ${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)}` +
    ` ${(size / 1024).toFixed(1).padStart(7)} KB   fundo removido: ${(proporcaoRemovida * 100).toFixed(1)}%`
  );
}

/* Placas da página de anúncio. As artes trazem o ícone "queimado" no canto
   esquerdo, o que impede um 9-slice limpo (o ícone distorce ao esticar o
   centro). Recortamos a parte direita — textura + moldura, sem ícone — e é
   essa faixa que vira border-image; os ícones entram por cima em SVG. */
const PLACAS = [
  { arquivo: "ChatGPT Image 23 de jul. de 2026, 14_48_40-Photoroom.png", nome: "placa-vermelha", corteEsq: 0.36 },
  { arquivo: "ChatGPT Image 23 de jul. de 2026, 14_48_50-Photoroom.png", nome: "placa-alerta", corteEsq: 0.34 }
];

for (const placa of PLACAS) {
  const entrada = path.join(ORIGEM, placa.arquivo);
  /* apara a moldura transparente primeiro; só então recorta a parte direita */
  const aparada = await sharp(entrada).trim({ threshold: 10 }).toBuffer();
  const meta = await sharp(aparada).metadata();
  const left = Math.round(meta.width * placa.corteEsq);
  const saida = path.join(DESTINO, `${placa.nome}.webp`);

  await sharp(aparada)
    .extract({ left, top: 0, width: meta.width - left, height: meta.height })
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toFile(saida);

  const { size } = await fs.stat(saida);
  const m = await sharp(saida).metadata();
  console.log(`${placa.nome.padEnd(16)} ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(size / 1024).toFixed(1).padStart(7)} KB`);
}

/* Ícones de tipagem: o VPLab guarda PNGs de 225x173 (872 KB no total), peso
   demais para um selo de 16px no card. Geramos WebP de 48px aqui — a fonte
   continua sendo a pasta do VPLab. */
const TIPOS_ORIGEM = path.join(process.cwd(), "apps", "vpertz-lab", "public", "assets", "route", "types");
const TIPOS_DESTINO = path.join(DESTINO, "types");
await fs.mkdir(TIPOS_DESTINO, { recursive: true });

let totalTipos = 0;
for (const arquivo of await fs.readdir(TIPOS_ORIGEM)) {
  if (!arquivo.endsWith(".png")) continue;
  const saida = path.join(TIPOS_DESTINO, arquivo.replace(".png", ".webp"));
  await sharp(path.join(TIPOS_ORIGEM, arquivo))
    .resize({ height: 48, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toFile(saida);
  totalTipos += (await fs.stat(saida)).size;
}
console.log(`\n18 ícones de tipagem -> ${(totalTipos / 1024).toFixed(1)} KB no total`);

/* Botões completos do vendedor (Compartilhar e Denunciar). Ao contrário das
   placas recortadas, aqui mantemos a arte inteira — os dois cantos e o ícone
   queimado — só aparando a margem transparente. Viram fundo do botão. */
const BOTOES = [
  { arquivo: "ChatGPT Image 23 de jul. de 2026, 22_56_10-Photoroom.png", nome: "botao-compartilhar" },
  { arquivo: "ChatGPT Image 23 de jul. de 2026, 14_48_50-Photoroom.png", nome: "botao-denunciar" }
];
for (const b of BOTOES) {
  const saida = path.join(DESTINO, `${b.nome}.webp`);
  await sharp(path.join(ORIGEM, b.arquivo))
    .trim({ threshold: 12 })
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toFile(saida);
  const { size } = await fs.stat(saida);
  const m = await sharp(saida).metadata();
  console.log(`${b.nome.padEnd(18)} ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(size / 1024).toFixed(1).padStart(7)} KB`);
}

/* Ícones dos campos do Pokémon (Nível, Gênero, IVs…). Vêm prontos e
   transparentes em apps/vpertz-lab/public/assets/pokemon-fields a 256px;
   reduzimos para ~44px de exibição. Nomes limpos, sem o prefixo numérico. */
const FIELDS_ORIGEM = path.join(process.cwd(), "apps", "vpertz-lab", "public", "assets", "pokemon-fields");
const FIELDS_DESTINO = path.join(DESTINO, "fields");
await fs.mkdir(FIELDS_DESTINO, { recursive: true });

let totalFields = 0;
for (const arquivo of await fs.readdir(FIELDS_ORIGEM)) {
  if (!arquivo.endsWith(".png")) continue;
  const nome = arquivo.replace(/^\d+-/, "").replace(".png", "");
  const saida = path.join(FIELDS_DESTINO, `${nome}.webp`);
  await sharp(path.join(FIELDS_ORIGEM, arquivo))
    .resize({ width: 88, height: 88, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, effort: 6, alphaQuality: 100 })
    .toFile(saida);
  totalFields += (await fs.stat(saida)).size;
}
console.log(`\n16 ícones de campo -> ${(totalFields / 1024).toFixed(1)} KB no total`);

/* Seta dourada do carrossel/breadcrumb. A arte vem com o xadrez falso de
   "transparência" rasterizado; recuperamos o alfa por flood fill como nas
   placas e recortamos na seta. */
{
  const entrada = path.join(ORIGEM, "ChatGPT Image 24 de jul. de 2026, 00_09_43.png");
  const { imagem } = await recuperarAlfa(entrada);
  const saida = path.join(DESTINO, "seta.webp");
  await imagem
    .png()
    .toBuffer()
    .then((buf) => sharp(buf)
      .trim({ threshold: 6 })
      .resize({ height: 48, withoutEnlargement: true })
      .webp({ quality: 92, effort: 6, alphaQuality: 100 })
      .toFile(saida));
  const { size } = await fs.stat(saida);
  const m = await sharp(saida).metadata();
  console.log(`seta              ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(size / 1024).toFixed(1).padStart(7)} KB`);
}

console.log(`\nArtes gravadas em ${path.relative(process.cwd(), DESTINO)}`);

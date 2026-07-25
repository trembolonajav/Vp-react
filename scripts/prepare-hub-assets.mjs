/* Prepara as artes do hub VPertsz (logo horizontal + placas das ferramentas).

   As exportações vêm com fundo rasterizado (radial escuro nas placas VP Store /
   VP Lab, cinza no VP Bazaar, preto na logo VPertsz). Recuperamos o alfa por
   crescimento de região a partir das bordas: um pixel vira fundo se estiver
   perto (distância Manhattan) do vizinho de fundo que o alcançou. Isso segue o
   gradiente suave do fundo e para na borda dourada/clara da placa (salto de cor
   grande). Depois recortamos na arte e gravamos WebP transparente.

   A logo horizontal fica em fundo preto e é usada com mix-blend-mode:screen no
   header — para ela basta aparar a moldura preta.

   Uso: node scripts/prepare-hub-assets.mjs [pasta-de-origem]
   As artes de origem não são versionadas; o resultado vai para
   apps/vpertz-store/public/assets/ (camada compartilhada servida na raiz). */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ORIGEM = process.argv[2] || "C:/Users/gabri/Downloads";
const DESTINO = path.join(process.cwd(), "apps", "vpertz-store", "public", "assets");

/* Placas das ferramentas: recorte por crescimento de região (fundo conectado à
   borda). tol = distância Manhattan (0–765) tolerada entre vizinhos de fundo. */
const PLACAS = [
  { arquivo: "ChatGPT Image 25 de jul. de 2026, 15_19_07.png", nome: "tool-store",  tol: 16, largura: 620 },
  { arquivo: "ChatGPT Image 25 de jul. de 2026, 15_27_45.png", nome: "tool-vplab",  tol: 16, largura: 620 },
  { arquivo: "ChatGPT Image 25 de jul. de 2026, 15_46_39.png", nome: "tool-bazaar", tol: 26, largura: 620 }
];

async function recortarFundo(entrada, tol) {
  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const fundo = new Uint8Array(w * h);
  const pilha = [];

  const cor = (i) => { const p = i * ch; return [data[p], data[p + 1], data[p + 2]]; };
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  const semear = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (fundo[i]) return;
    fundo[i] = 1; pilha.push(i);
  };
  for (let x = 0; x < w; x++) { semear(x, 0); semear(x, h - 1); }
  for (let y = 0; y < h; y++) { semear(0, y); semear(w - 1, y); }

  while (pilha.length) {
    const i = pilha.pop();
    const x = i % w, y = (i - x) / w;
    const c = cor(i);
    const testar = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const ni = ny * w + nx;
      if (fundo[ni]) return;
      if (dist(cor(ni), c) <= tol) { fundo[ni] = 1; pilha.push(ni); }
    };
    testar(x - 1, y); testar(x + 1, y); testar(x, y - 1); testar(x, y + 1);
  }

  let removidos = 0;
  for (let i = 0; i < w * h; i++) if (fundo[i]) { data[i * ch + 3] = 0; removidos++; }
  return { imagem: sharp(data, { raw: { width: w, height: h, channels: ch } }), pct: removidos / (w * h) };
}

await fs.mkdir(DESTINO, { recursive: true });

for (const placa of PLACAS) {
  /* As placas ficam em fundo escuro/cinza e são exibidas com
     mix-blend-mode:screen sobre o card escuro do hub — como as outras logos do
     site. Só aparamos a moldura de fundo; nada de recorte por flood fill (a
     placa tem miolo escuro conectado ao fundo pelo chapéu e o fill vaza). */
  const saida = path.join(DESTINO, `${placa.nome}.webp`);
  await sharp(path.join(ORIGEM, placa.arquivo))
    .trim({ threshold: placa.tol })
    .resize({ width: placa.largura, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(saida);
  const { size } = await fs.stat(saida);
  const m = await sharp(saida).metadata();
  console.log(`${placa.nome.padEnd(14)} ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(size / 1024).toFixed(1).padStart(7)} KB`);
}

/* Logo horizontal VPertsz — fundo preto, usada com mix-blend-mode:screen. */
{
  const saida = path.join(DESTINO, "logo-vpertsz-horizontal.webp");
  await sharp(path.join(ORIGEM, "ChatGPT Image 25 de jul. de 2026, 15_43_13.png"))
    .trim({ threshold: 18 })
    .resize({ width: 760, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6 })
    .toFile(saida);
  const { size } = await fs.stat(saida);
  const m = await sharp(saida).metadata();
  console.log(`logo-vpertsz   ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(size / 1024).toFixed(1).padStart(7)} KB`);
}

console.log(`\nArtes gravadas em ${path.relative(process.cwd(), DESTINO)}`);

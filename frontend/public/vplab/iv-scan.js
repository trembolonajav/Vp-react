/* OCR local dos cards do PokeIdle. A API pública é window.IvScan.readCard(). */
(function () {
  "use strict";

  const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  const TIMEOUT = 60000;
  const PSM = { SINGLE_WORD: "8", SINGLE_LINE: "7", RAW_LINE: "13", SPARSE: "11" };
  const clean = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let workerPromise;
  let progressHandler;
  let recognizeChain = Promise.resolve();

  function getWorker(paths) {
    if (!workerPromise) {
      workerPromise = Tesseract.createWorker("por+eng", 1, {
        ...paths,
        logger(message) {
          if (message.status === "recognizing text") progressHandler?.(message.progress);
        }
      });
    }
    return workerPromise;
  }

  async function recognize(paths, image, parameters) {
    const run = async () => {
      const worker = await getWorker(paths);
      await worker.setParameters({
        tessedit_pageseg_mode: parameters.psm,
        tessedit_char_whitelist: parameters.whitelist || "",
        preserve_interword_spaces: parameters.preserveSpaces ? "1" : "0",
        load_system_dawg: parameters.numeric ? "0" : "1",
        load_freq_dawg: parameters.numeric ? "0" : "1",
        user_defined_dpi: "300"
      });
      let timer;
      try {
        return (await Promise.race([
          worker.recognize(image),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("OCR_TIMEOUT")), TIMEOUT); })
        ])).data;
      } finally {
        clearTimeout(timer);
      }
    };
    const pending = recognizeChain.then(run, run);
    recognizeChain = pending.catch(() => {});
    return pending;
  }

  function canvasFrom(bitmap, box, scale = 1, smoothing = true) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(box.width * scale));
    canvas.height = Math.max(1, Math.round(box.height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = smoothing;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
    return { canvas, ctx };
  }

  function addPadding(source, amount = 18) {
    const canvas = document.createElement("canvas");
    canvas.width = source.width + amount * 2;
    canvas.height = source.height + amount * 2;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, amount, amount);
    return canvas;
  }

  function enhance(canvas, options = {}) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    const lo = options.lo ?? 35, hi = options.hi ?? 190;
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114;
      let value = options.threshold ? (gray >= options.threshold ? 255 : 0) :
        Math.max(0, Math.min(255, (gray - lo) * 255 / (hi - lo)));
      if (options.invert) value = 255 - value;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  function detectLayout(bitmap) {
    const { canvas, ctx } = canvasFrom(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height }, Math.min(1, 500 / bitmap.width));
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let longGreenRows = 0;
    for (let y = 0; y < canvas.height; y += 2) {
      let run = 0, longest = 0;
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 1] > 95 && pixels[i + 1] > pixels[i] + 25 && pixels[i + 1] > pixels[i + 2] + 40) run++;
        else { longest = Math.max(longest, run); run = 0; }
      }
      if (Math.max(longest, run) > canvas.width * .32) longGreenRows++;
    }
    return longGreenRows >= 5 ? "bars" : "compact";
  }

  function compactGeometry(bitmap) {
    const { canvas, ctx } = canvasFrom(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height });
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const rowScores = [];
    for (let y = Math.round(canvas.height * .22); y < canvas.height * .7; y++) {
      let run = 0, longest = 0, runStart = 0, longestStart = 0, longestEnd = 0;
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        if (r > 15 && g > 15 && r >= g && g >= b && r - b > 5) {
          if (!run) runStart = x;
          run++;
        } else {
          if (run > longest) { longest = run; longestStart = runStart; longestEnd = x - 1; }
          run = 0;
        }
      }
      if (run > longest) { longest = run; longestStart = runStart; longestEnd = canvas.width - 1; }
      rowScores.push({ y, longest, start: longestStart, end: longestEnd });
    }
    const divider = rowScores.sort((a, b) => b.longest - a.longest)[0];
    const anchorY = divider && divider.longest > canvas.width * .55 ? divider.y : Math.round(canvas.height * .46);
    const unit = Math.max(11, Math.round(canvas.height * .073));
    const hasDivider = divider && divider.longest > canvas.width * .55;
    const contentX = hasDivider ? Math.max(0, divider.start - 10) : 0;
    const contentRight = hasDivider ? Math.min(bitmap.width, divider.end + 11) : bitmap.width;
    const contentWidth = Math.max(1, contentRight - contentX);
    const box = (x, y, width, height) => ({
      x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)),
      width: Math.min(bitmap.width - Math.max(0, Math.round(x)), Math.max(1, Math.round(width))),
      height: Math.min(bitmap.height - Math.max(0, Math.round(y)), Math.max(1, Math.round(height)))
    });
    return {
      card: box(0, 0, bitmap.width, bitmap.height),
      dividerY: anchorY,
      content: box(contentX, 0, contentWidth, bitmap.height),
      name: box(contentX, Math.max(0, anchorY - unit * 5.2), contentWidth * .62, unit * 1.65),
      level: box(contentX, anchorY + 1, contentWidth * .24, unit * 1.6),
      /* No tooltip, o multiplicador fica imediatamente antes do bloco de IV.
         Ler apenas esse sufixo evita que "Qualidade/Lendária" vire ruído. */
      quality: box(contentX + contentWidth * .53, anchorY, contentWidth * .21, unit * 1.65),
      ivWide: box(contentX + contentWidth * .65, anchorY - 1, contentWidth * .35, unit * 1.8),
      hp: box(contentX, anchorY + unit * 1.25, contentWidth / 3, unit * 1.55),
      attack: box(contentX + contentWidth / 3, anchorY + unit * 1.25, contentWidth / 3, unit * 1.55),
      defense: box(contentX + contentWidth * 2 / 3, anchorY + unit * 1.25, contentWidth / 3, unit * 1.55),
      specialAttack: box(contentX, anchorY + unit * 2.45, contentWidth / 3, unit * 1.6),
      specialDefense: box(contentX + contentWidth / 3, anchorY + unit * 2.45, contentWidth / 3, unit * 1.6),
      speed: box(contentX + contentWidth * 2 / 3, anchorY + unit * 2.45, contentWidth / 3, unit * 1.6),
      power: box(contentX, anchorY + unit * 3.75, contentWidth * .68, unit * 1.75)
    };
  }

  function digits(value) { return String(value || "").replace(/[oO]/g, "0").replace(/[iIl!|]/g, "1").replace(/[^0-9]/g, ""); }
  function parseLevel(text) {
    const hit = clean(text).match(/(?:nv|nivel|lvl)\s*[:.]?\s*([0-9oil!|]{1,3})/i);
    if (hit) return digits(hit[1]);
    return String(text || "").match(/\d{1,3}/)?.[0] || "";
  }

  function barsGeometry(bitmap) {
    const { canvas, ctx } = canvasFrom(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height });
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const rows = [];
    for (let y = 0; y < canvas.height; y++) {
      let run = 0, longest = 0;
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        if (g > 90 && g > r * 1.15 && g > b * 1.08) run++;
        else { longest = Math.max(longest, run); run = 0; }
      }
      if (Math.max(longest, run) > canvas.width * .28) rows.push(y);
    }
    const bands = [];
    for (const y of rows) {
      const last = bands.at(-1);
      if (last && y <= last.end + 1) last.end = y;
      else bands.push({ start: y, end: y });
    }
    const statBands = bands.slice(-6);
    const box = (x, y, width, height) => ({
      x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)),
      width: Math.min(bitmap.width - Math.max(0, Math.round(x)), Math.max(1, Math.round(width))),
      height: Math.min(bitmap.height - Math.max(0, Math.round(y)), Math.max(1, Math.round(height)))
    });
    return {
      card: box(0, 0, bitmap.width, bitmap.height),
      quality: box(bitmap.width * .57, bitmap.height * .18, bitmap.width * .29, bitmap.height * .12),
      statValues: statBands.map((band) => box(bitmap.width * .86, (band.start + band.end) / 2 - bitmap.height * .035, bitmap.width * .14, bitmap.height * .07))
    };
  }
  function parseQuality(text) {
    const normalized = clean(text).replace(/×/g, "x");
    const contextual = normalized.match(/(?:x|lendaria|qualidade)([^0-9]{0,20})([01][.,/]?\s*\d{1,3})/i);
    let token = contextual && !/\b(?:iv|nv|nivel)\b/.test(contextual[1]) ? contextual[2] : "";
    if (!token && normalized.length <= 30) token = normalized.match(/([01][.,/]?\s*\d{1,3})/)?.[1] || "";
    token = token.replace(/[oO]/g, "0").replace(/[iIl!|]/g, "1").replace(/\s/g, "").replace(",", ".").replace("/", ".");
    if (/^[01]\d{2,3}$/.test(token)) token = `${token[0]}.${token.slice(1)}`;
    const value = Number(token);
    return value >= .8 && value <= 1.8 ? String(value) : "";
  }
  function parseIv(text) {
    const normalized = String(text || "").replace(/[|lI!]/g, "1").replace(/[zZ]/g, "2");
    const anchored = normalized.match(/(?:1?v\s*)?(\d{1,3})\s*(?:\/|\s)\s*192\b/i);
    const current = anchored ? +anchored[1] : NaN;
    if (!Number.isFinite(current) || current < 0 || current > 192) return { current: "", maximum: "" };
    return { current: String(current), maximum: "192" };
  }
  function parseNamedInteger(text, labels, max = 99999999) {
    const normalized = clean(text);
    const labeled = normalized.match(new RegExp(`(?:${labels.join("|")})[^0-9]{0,10}([0-9][0-9.,]*)`, "i"));
    const value = digits(labeled?.[1] || normalized.match(/[0-9][0-9.,]*/)?.[0] || "");
    return value && +value > 0 && +value <= max ? String(+value) : "";
  }

  function field(value = "", confidence = 0, raw = "", variant = "", source = "ocr") {
    return { value, confidence: Math.round(confidence || 0), raw: String(raw || "").trim(), variant, source: value ? source : "missing" };
  }

  async function readRegion(paths, bitmap, name, box, config, debug, diagnostic = false) {
    /* Texto do tooltip já é raster. Escalar até ~420 px preserva os glifos sem
       transformar cada recorte numa imagem gigante e lenta para o Tesseract. */
    const targetWidth = name === "quality" ? 700 : 420;
    const scale = Math.max(2, Math.min(name === "quality" ? 8 : 5, Math.ceil(targetWidth / Math.max(box.width, 1))));
    const variants = [
      { name: "lanczos-color", smoothing: true, options: null },
      { name: "lanczos-contrast", smoothing: true, options: { lo: 32, hi: 185, invert: true } }
    ];
    if (config.tryAll) {
      variants.push({ name: "nearest-contrast", smoothing: false, options: { lo: 32, hi: 185, invert: true } });
    }
    if (name === "ivWide") {
      variants.push({ name: "binary-105", smoothing: true, options: { threshold: 105, invert: true } });
    }
    let best = field();
    let bestScore = -1;
    const candidates = new Map();
    for (const variant of variants) {
      const drawn = canvasFrom(bitmap, box, scale, variant.smoothing);
      if (variant.options) enhance(drawn.canvas, variant.options);
      const image = addPadding(drawn.canvas, 16);
      const startedAt = performance.now();
      const data = await recognize(paths, await toBlob(image), config);
      const elapsedMs = Math.round(performance.now() - startedAt);
      const value = config.parse(data.text || "");
      const confidence = Number(data.confidence) || 0;
      debug.push({
        region: name, box, variant: variant.name, scale,
        psm: config.psm, whitelist: config.whitelist || "",
        raw: data.text || "", confidence, normalized: value, elapsedMs,
        processedImage: diagnostic ? image.toDataURL("image/png") : ""
      });
      const structural = config.score ? config.score(value, data.text || "", confidence) : confidence;
      if (value) {
        const candidate = candidates.get(value) || { count:0, structural:-1, item:null };
        candidate.count++;
        if (structural > candidate.structural) {
          candidate.structural = structural;
          candidate.item = field(value, confidence, data.text, variant.name);
        }
        candidates.set(value, candidate);
      }
      if (value && structural > bestScore) { best = field(value, confidence, data.text, variant.name); bestScore = structural; }
      if (value && confidence >= (config.acceptConfidence ?? 35) && !config.tryAll) break;
    }
    if (name.startsWith("iv") && candidates.size) {
      const winner = [...candidates.values()].sort((a, b) => b.count - a.count || b.structural - a.structural)[0];
      best = winner.item;
      best.votes = winner.count;
    }
    return best;
  }

  async function readCompact(paths, bitmap, onProgress, diagnostic = false) {
    const regions = compactGeometry(bitmap);
    const debug = [];
    const originalCanvas = canvasFrom(bitmap, regions.card, 1, true).canvas;
    onProgress("Detectando textos do card", 0);
    let startedAt = performance.now();
    const originalData = await recognize(paths, await toBlob(originalCanvas), { psm: "6" });
    const originalWhole = parseWholeCard(originalData.text || "");
    debug.push({ region: "card", box: regions.card, variant: "whole-original", psm: "6", raw: originalData.text || "", confidence: originalData.confidence, normalized: originalWhole, elapsedMs: Math.round(performance.now() - startedAt), processedImage: diagnostic ? originalCanvas.toDataURL("image/png") : "" });
    const wholeScale = Math.min(4, Math.max(2, Math.ceil(800 / bitmap.width)));
    const wholeCanvas = canvasFrom(bitmap, regions.card, wholeScale, true);
    enhance(wholeCanvas.canvas, { lo: 45, hi: 200, invert: true });
    onProgress("Mapeando o card", 0);
    startedAt = performance.now();
    const wholeData = await recognize(paths, await toBlob(wholeCanvas.canvas), { psm: "6" });
    const whole = parseWholeCard(wholeData.text || "");
    debug.push({ region: "card", box: regions.card, variant: "whole-lanczos-contrast", psm: "6", raw: wholeData.text || "", confidence: wholeData.confidence, normalized: whole, elapsedMs: Math.round(performance.now() - startedAt), processedImage: diagnostic ? wholeCanvas.canvas.toDataURL("image/png") : "" });
    const jobs = [
      ["name", { psm: PSM.SINGLE_LINE, parse: (t) => String(t || "").trim().replace(/[^A-Za-zÀ-ÿ♀♂ '-]/g, "") }],
      ["level", { psm: PSM.SINGLE_LINE, whitelist: "NvNIVELnivelvlL0123456789", numeric: true, parse: parseLevel }],
      ["quality", { psm: PSM.SINGLE_LINE, parse: parseQuality }],
      ["ivWide", { psm: PSM.SINGLE_LINE, whitelist: "IVivlV0123456789/ ", numeric: true, tryAll: true, score: (v, t, c) => (/192/.test(t) ? 100 : 0) + c, parse: (t) => parseIv(t).current }],
      ["hp", { psm: PSM.SINGLE_LINE, whitelist: "HP0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["hp"], 9999999) }],
      ["attack", { psm: PSM.SINGLE_LINE, whitelist: "AtkATK0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["atk"], 9999999) }],
      ["defense", { psm: PSM.SINGLE_LINE, whitelist: "DefDEF0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["def"], 9999999) }],
      ["specialAttack", { psm: PSM.SINGLE_LINE, whitelist: "SpA0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["spa"], 9999999) }],
      ["specialDefense", { psm: PSM.SINGLE_LINE, whitelist: "SpD0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["spd", "spb", "spo"], 9999999) }],
      ["speed", { psm: PSM.SINGLE_LINE, whitelist: "VelVEL0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["vel"], 9999999) }],
      ["power", { psm: PSM.SINGLE_LINE, whitelist: "PoderPOWERpoderpower.0123456789", numeric: true, parse: (t) => parseNamedInteger(t, ["poder", "power"]) }]
    ];
    const result = {};
    for (let i = 0; i < jobs.length; i++) {
      const [name, config] = jobs[i];
      onProgress(`Lendo ${name === "iv" ? "IV" : "dados do card"}`, i / jobs.length);
      result[name] = await readRegion(paths, bitmap, name, regions[name], config, debug, diagnostic);
    }
    const wholeValues = {
      level: whole.level, quality: whole.quality, iv: whole.ivTotal, power: whole.power,
      hp: whole.stats[0], attack: whole.stats[1], defense: whole.stats[2],
      specialAttack: whole.stats[3], specialDefense: whole.stats[4], speed: whole.stats[5]
    };
    const originalValues = {
      level: originalWhole.level, quality: originalWhole.quality, iv: originalWhole.ivTotal, power: originalWhole.power,
      hp: originalWhole.stats[0], attack: originalWhole.stats[1], defense: originalWhole.stats[2],
      specialAttack: originalWhole.stats[3], specialDefense: originalWhole.stats[4], speed: originalWhole.stats[5]
    };
    result.iv = result.ivWide || field();
    /* A leitura ampla com rótulos preserva o contexto e tem prioridade quando
       conseguiu extrair um campo. Recortes existem para completar ausências,
       não para trocar um valor contextual por um dígito isolado. */
    const contextualValues = { ...wholeValues };
    if (/lendaria/i.test(clean(wholeData.text || "")) && +contextualValues.quality < 1.7) contextualValues.quality = "";
    for (const [name, value] of Object.entries(contextualValues)) {
      if (value) result[name] = field(value, wholeData.confidence, wholeData.text, "whole-lanczos-contrast");
    }
    for (const [name, value] of Object.entries(originalValues)) {
      if (value && !result[name]?.value) result[name] = field(value, originalData.confidence, originalData.text, "whole-original");
    }
    delete result.ivWide;
    result.ivMaximum = field(result.iv.value ? "192" : "", result.iv.confidence, result.iv.raw, result.iv.variant);
    return { result, regions, debug };
  }

  function parseWholeCard(text) {
    const normalized = clean(text);
    const lineInteger = (labels) => {
      for (const label of labels) {
        const hit = normalized.match(new RegExp(`(?:^|\\s)${label}[^\\n0-9]{0,12}([0-9][0-9.,]*)`, "im"));
        if (hit) return digits(hit[1]);
      }
      return "";
    };
    const iv = parseIv(normalized.match(/(?:^|\s)(?:iv|1v)\b[^\n]*/)?.[0] || "");
    const powerAfter = normalized.match(/(?:poder|power)[^\n0-9]{0,8}([0-9][0-9.,]*)/i)?.[1];
    const powerBefore = normalized.match(/([0-9][0-9.,]*)[^\n0-9]{0,4}(?:poder|power)/i)?.[1];
    return {
      level: parseLevel(normalized.match(/(?:nv|nivel|lvl)[^\n]*/)?.[0] || ""),
      quality: parseQuality(normalized), ivTotal: iv.current, ivMaximum: iv.maximum,
      power: digits(powerAfter || powerBefore || ""),
      stats: [
        lineInteger(["hp"]), lineInteger(["atk"]), lineInteger(["def"]),
        lineInteger(["sp[ah]"]), lineInteger(["sp[dpob]"]), lineInteger(["vel"])
      ]
    };
  }

  async function readBars(paths, bitmap, file, onProgress, diagnostic = false) {
    onProgress("Lendo card completo", 0);
    progressHandler = (p) => onProgress("Lendo card completo", p);
    const startedAt = performance.now();
    const data = await recognize(paths, file, { psm: "6" });
    const parsed = parseWholeCard(data.text || "");
    const regions = barsGeometry(bitmap);
    const debug = [{ region: "card", box: regions.card, variant: "original", psm: "6", raw: data.text || "", confidence: data.confidence, elapsedMs: Math.round(performance.now() - startedAt), processedImage: diagnostic ? URL.createObjectURL(file) : "" }];
    onProgress("Lendo qualidade", .2);
    const quality = await readRegion(paths, bitmap, "quality", regions.quality, { psm: PSM.SINGLE_LINE, parse: parseQuality }, debug, diagnostic);
    const statFields = [];
    for (let i = 0; i < regions.statValues.length; i++) {
      onProgress("Lendo atributos", .3 + i * .1);
      statFields.push(await readRegion(paths, bitmap, `barStat${i}`, regions.statValues[i], {
        psm: PSM.SINGLE_LINE, whitelist: "0123456789", numeric: true,
        parse: (text) => text.match(/\d{1,7}/)?.[0] || ""
      }, debug, diagnostic));
    }
    const make = (value) => field(value, data.confidence, data.text, "whole-card");
    while (statFields.length < 6) statFields.push(field());
    return {
      result: {
        name: make(""), level: make(parsed.level), quality: quality.value ? quality : make(parsed.quality),
        iv: make(parsed.ivTotal), ivMaximum: make(parsed.ivMaximum), power: make(parsed.power),
        hp: statFields[0].value ? statFields[0] : make(parsed.stats[0]),
        attack: statFields[1].value ? statFields[1] : make(parsed.stats[1]),
        defense: statFields[2].value ? statFields[2] : make(parsed.stats[2]),
        specialAttack: statFields[3].value ? statFields[3] : make(parsed.stats[3]),
        specialDefense: statFields[4].value ? statFields[4] : make(parsed.stats[4]),
        speed: statFields[5].value ? statFields[5] : make(parsed.stats[5])
      },
      regions,
      debug
    };
  }

  async function readCard(file, { paths = {}, onProgress = () => {}, debug = false, diagnostic = false } = {}) {
    if (!window.Tesseract) throw new Error("TESSERACT_MISSING");
    const bitmap = await createImageBitmap(file);
    try {
      const layout = detectLayout(bitmap);
      const source = bitmap;
      const read = layout === "compact" ? await readCompact(paths, source, onProgress, diagnostic) : await readBars(paths, bitmap, file, onProgress, diagnostic);
      const r = read.result;
      const fields = {
        level: r.level.value, quality: r.quality.value, power: r.power.value,
        total: r.iv.value, totalMax: r.ivMaximum.value,
        stats: [r.hp, r.attack, r.defense, r.specialAttack, r.specialDefense, r.speed].map((item) => item.value)
      };
      const sources = {
        level: r.level.source, quality: r.quality.source, power: r.power.source,
        total: r.iv.source, totalMax: r.ivMaximum.source,
        stats: [r.hp, r.attack, r.defense, r.specialAttack, r.specialDefense, r.speed].map((item) => item.source)
      };
      const searchText = read.debug.map((item) => item.raw).join("\n");
      if (/lendaria/i.test(clean(searchText)) && +fields.quality > 0 && +fields.quality < 1.7) {
        fields.quality = "";
        sources.quality = "missing";
      }
      const statSum = fields.stats.reduce((sum, value) => sum + (+value || 0), 0);
      const inconsistent = fields.stats.every(Boolean) && +fields.quality > 0 && +fields.power > 0 &&
        Math.abs(Math.round(statSum * +fields.quality) - +fields.power) > 1;
      if (debug) console.table(read.debug.map((item) => ({ ...item, box: item.box ? JSON.stringify(item.box) : "" })));
      return { layout, fields, sources, regions: read.regions, debug: read.debug, searchText, inconsistent };
    } finally {
      progressHandler = null;
      bitmap.close();
    }
  }

  window.IvScan = { readCard, isAcceptedImage: (file) => Boolean(file) && ACCEPTED_TYPES.has(file.type), detectLayout, compactGeometry, barsGeometry, parseQuality, parseIv, parseWholeCard };
})();

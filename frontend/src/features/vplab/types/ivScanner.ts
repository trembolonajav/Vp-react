export const STAT_LABELS = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocidade"] as const;

export interface IvScanFields {
  species: string;
  level: string;
  quality: string;
  ivTotal: string;
  ivMaximum: string;
  power: string;
  stats: [string, string, string, string, string, string];
}

export interface IvScanResult {
  fields: IvScanFields;
  rawText: string;
  confidence: number;
  elapsedMs: number;
  engine: "PaddleOCR PP-OCRv6";
}

export const EMPTY_IV_SCAN: IvScanFields = {
  species: "",
  level: "",
  quality: "",
  ivTotal: "",
  ivMaximum: "",
  power: "",
  stats: ["", "", "", "", "", ""],
};

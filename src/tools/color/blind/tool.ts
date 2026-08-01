export type CVDType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export interface ColorPair {
  foreground: string;
  background: string;
  originalRatio: number;
  simulatedRatio: number;
  risky: boolean;
  cvdType: CVDType;
}

export interface SimulationResult {
  original: string;
  simulated: string;
  cvdType: CVDType;
}

const protanopiaMatrix = [
  [0.567, 0.433, 0],
  [0.558, 0.442, 0],
  [0, 0.242, 0.758],
];

const deuteranopiaMatrix = [
  [0.625, 0.375, 0],
  [0.7, 0.3, 0],
  [0, 0.3, 0.7],
];

const tritanopiaMatrix = [
  [0.95, 0.05, 0],
  [0, 0.433, 0.567],
  [0, 0.475, 0.525],
];

const achromatopsiaMatrix = [
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114],
  [0.299, 0.587, 0.114],
];

const matrices: Record<CVDType, number[][]> = {
  protanopia: protanopiaMatrix,
  deuteranopia: deuteranopiaMatrix,
  tritanopia: tritanopiaMatrix,
  achromatopsia: achromatopsiaMatrix,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`;
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function applyMatrix(r: number, g: number, b: number, matrix: number[][]): { r: number; g: number; b: number } {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const r2 = linearToSrgb(lr * matrix[0][0] + lg * matrix[0][1] + lb * matrix[0][2]);
  const g2 = linearToSrgb(lr * matrix[1][0] + lg * matrix[1][1] + lb * matrix[1][2]);
  const b2 = linearToSrgb(lr * matrix[2][0] + lg * matrix[2][1] + lb * matrix[2][2]);

  return {
    r: Math.max(0, Math.min(255, Math.round(r2 * 255))),
    g: Math.max(0, Math.min(255, Math.round(g2 * 255))),
    b: Math.max(0, Math.min(255, Math.round(b2 * 255))),
  };
}

export function simulateCVD(hex: string, type: CVDType): string {
  const { r, g, b } = hexToRgb(hex);
  const matrix = matrices[type];
  const { r: sr, g: sg, b: sb } = applyMatrix(r, g, b, matrix);
  return rgbToHex(sr, sg, sb);
}

export function simulatePaletteCVD(colors: string[], type: CVDType): SimulationResult[] {
  return colors.map(color => ({
    original: color,
    simulated: simulateCVD(color, type),
    cvdType: type,
  }));
}

function luminance(r: number, g: number, b: number): number {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(fg: string, bg: string): number {
  const { r: fr, g: fgG, b: fb } = hexToRgb(fg);
  const { r: br, g: bgG, b: bb } = hexToRgb(bg);
  const l1 = luminance(fr, fgG, fb);
  const l2 = luminance(br, bgG, bb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkColorPairRisk(
  fg: string,
  bg: string,
  cvdType: CVDType
): ColorPair {
  const originalRatio = contrastRatio(fg, bg);
  const simFg = simulateCVD(fg, cvdType);
  const simBg = simulateCVD(bg, cvdType);
  const simulatedRatio = contrastRatio(simFg, simBg);
  const risky = simulatedRatio < 3;

  return {
    foreground: fg,
    background: bg,
    originalRatio: Math.round(originalRatio * 100) / 100,
    simulatedRatio: Math.round(simulatedRatio * 100) / 100,
    risky,
    cvdType,
  };
}

export function checkPaletteRisks(
  colors: string[],
  cvdType: CVDType
): ColorPair[] {
  const risks: ColorPair[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      risks.push(checkColorPairRisk(colors[i], colors[j], cvdType));
    }
  }
  return risks;
}

export function checkAllCVDTypes(
  colors: string[]
): { [key in CVDType]: ColorPair[] } {
  return {
    protanopia: checkPaletteRisks(colors, "protanopia"),
    deuteranopia: checkPaletteRisks(colors, "deuteranopia"),
    tritanopia: checkPaletteRisks(colors, "tritanopia"),
    achromatopsia: checkPaletteRisks(colors, "achromatopsia"),
  };
}

export function findSafeColors(
  baseColor: string,
  candidates: string[],
  cvdType: CVDType,
  minRatio = 4.5
): string[] {
  return candidates.filter(candidate => {
    const risk = checkColorPairRisk(baseColor, candidate, cvdType);
    return !risk.risky && risk.simulatedRatio >= minRatio;
  });
}

export function generateCVDReport(
  colors: string[],
  includeAchromatopsia = true
): {
  summary: { type: CVDType; riskyPairs: number; totalPairs: number }[];
  details: { [key in CVDType]: ColorPair[] };
} {
  const types: CVDType[] = ["protanopia", "deuteranopia", "tritanopia"];
  if (includeAchromatopsia) types.push("achromatopsia");

  const details = checkAllCVDTypes(colors);
  const summary = types.map(type => ({
    type,
    riskyPairs: details[type].filter(p => p.risky).length,
    totalPairs: details[type].length,
  }));

  return { summary, details };
}

export function simulateImageData(
  imageData: ImageData,
  type: CVDType
): ImageData {
  const matrix = matrices[type];
  const output = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    const { r: sr, g: sg, b: sb } = applyMatrix(r, g, b, matrix);
    output.data[i] = sr;
    output.data[i + 1] = sg;
    output.data[i + 2] = sb;
    output.data[i + 3] = a;
  }
  return output;
}

export function getCVDName(type: CVDType): string {
  const names: Record<CVDType, string> = {
    protanopia: "Protanopia (Red-blind)",
    deuteranopia: "Deuteranopia (Green-blind)",
    tritanopia: "Tritanopia (Blue-blind)",
    achromatopsia: "Achromatopsia (Monochromacy)",
  };
  return names[type];
}
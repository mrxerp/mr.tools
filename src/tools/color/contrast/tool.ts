export interface ContrastResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  ui: boolean;
  level: "fail" | "aa" | "aaa";
}

export interface ContrastSuggestion {
  original: string;
  adjusted: string;
  ratio: number;
  meets: string[];
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  throw new Error("Invalid hex color");
}

function rgbToLinear(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function luminance(r: number, g: number, b: number): number {
  const [lr, lg, lb] = rgbToLinear(r, g, b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(fg: string, bg: string): number {
  const [fr, fgR, fb] = parseHex(fg);
  const [br, bgR, bb] = parseHex(bg);
  const l1 = luminance(fr, fgR, fb);
  const l2 = luminance(br, bgR, bb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(fg: string, bg: string): ContrastResult {
  const ratio = contrastRatio(fg, bg);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaaNormal = ratio >= 7;
  const aaaLarge = ratio >= 4.5;
  const ui = ratio >= 3;
  let level: ContrastResult["level"] = "fail";
  if (aaaNormal) level = "aaa";
  else if (aaNormal) level = "aa";
  return { ratio, aaNormal, aaLarge, aaaNormal, aaaLarge, ui, level };
}

function clamp(c: number): number {
  return Math.max(0, Math.min(255, Math.round(c)));
}

function adjustLightness(hex: string, targetRatio: number, bg: string, isFg: boolean): string {
  const [r, g, b] = parseHex(hex);
  const [br, bgR, bb] = parseHex(bg);
  const bgLum = luminance(br, bgR, bb);

  let low = 0;
  let high = 255;
  let best = hex;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const factor = mid / 255;
    const nr = clamp(r * factor + (1 - factor) * (isFg ? 255 : 0));
    const ng = clamp(g * factor + (1 - factor) * (isFg ? 255 : 0));
    const nb = clamp(b * factor + (1 - factor) * (isFg ? 255 : 0));
    const testHex = `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
    const ratio = isFg ? contrastRatio(testHex, bg) : contrastRatio(bg, testHex);
    if (ratio >= targetRatio) {
      best = testHex;
      high = mid;
    } else {
      low = mid;
    }
  }
  return best;
}

export function suggestFixes(fg: string, bg: string): ContrastSuggestion[] {
  const results: ContrastSuggestion[] = [];
  const targets = [
    { name: "AA Normal (4.5:1)", ratio: 4.5 },
    { name: "AA Large/UI (3:1)", ratio: 3 },
    { name: "AAA Normal (7:1)", ratio: 7 },
    { name: "AAA Large (4.5:1)", ratio: 4.5 },
  ];

  for (const t of targets) {
    const adjFg = adjustLightness(fg, t.ratio, bg, true);
    const ratio = contrastRatio(adjFg, bg);
    const meets: string[] = [];
    if (ratio >= 4.5) meets.push("AA Normal");
    if (ratio >= 3) meets.push("AA Large / UI");
    if (ratio >= 7) meets.push("AAA Normal");
    if (ratio >= 4.5 && ratio < 7) meets.push("AAA Large");
    results.push({ original: fg, adjusted: adjFg, ratio: Math.round(ratio * 100) / 100, meets });
  }
  return results;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const [r, g, b] = parseHex(hex);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}
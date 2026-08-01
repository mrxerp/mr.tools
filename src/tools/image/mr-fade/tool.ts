/** Fading / exposure heuristics over RGBA pixels. Deterministic, no DOM. */

export interface FadeReport {
  mean: number;
  blackPct: number;
  clippedPct: number;
  faded: boolean;
  clipped: boolean;
  vignette: number;
  verdict: string;
}

export function brightnessHistogram(data: Uint8ClampedArray): Uint32Array {
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    hist[Math.max(0, Math.min(255, luma))]++;
  }
  return hist;
}

/** Corner-vs-center brightness ratio (1 = even, lower = darkened edges). */
export function vignetteRatio(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): number {
  let centerSum = 0;
  let centerN = 0;
  let cornerSum = 0;
  let cornerN = 0;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxD = Math.sqrt(cx * cx + cy * cy) || 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxD;
      if (d < 0.35) {
        centerSum += luma;
        centerN++;
      } else if (d > 0.8) {
        cornerSum += luma;
        cornerN++;
      }
    }
  }
  const center = centerN ? centerSum / centerN : 0;
  const corner = cornerN ? cornerSum / cornerN : 0;
  return center > 0 ? Math.min(1, corner / center) : 1;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function verdictFor(
  faded: boolean,
  clipped: boolean,
  vignette: number,
  mean: number,
): string {
  const parts: string[] = [];
  if (faded) parts.push("faded — true blacks are missing");
  if (clipped) parts.push("clipped — highlights are blown out");
  if (vignette < 0.85) parts.push("vignette or darkened corners");
  if (parts.length === 0) {
    if (mean < 80) parts.push("underexposed — overall too dark");
    else if (mean > 200) parts.push("overexposed — overall too bright");
    else parts.push("no strong fading signs detected");
  }
  return parts.join("; ");
}

/**
 * Analyzes an image for fading, clipping, and vignette.
 * Honest heuristics: no correction, and small or noisy images can mislead.
 */
export function analyzeFade(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): FadeReport {
  const hist = brightnessHistogram(data);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < 256; i++) {
    sum += hist[i] * i;
    n += hist[i];
  }
  const mean = n ? sum / n : 0;
  let black = 0;
  for (let i = 0; i <= 10; i++) black += hist[i];
  let dark = 0;
  for (let i = 0; i < 70; i++) dark += hist[i];
  let clipped = 0;
  for (let i = 245; i < 256; i++) clipped += hist[i];
  const blackPct = n ? (black / n) * 100 : 0;
  const darkPct = n ? (dark / n) * 100 : 0;
  const clippedPct = n ? (clipped / n) * 100 : 0;
  const faded = blackPct < 0.5 && darkPct > 0.5 && mean < 150;
  const clippedHighlights = clippedPct > 2;
  const vignette = vignetteRatio(data, width, height);
  return {
    mean: round1(mean),
    blackPct: round1(blackPct),
    clippedPct: round1(clippedPct),
    faded,
    clipped: clippedHighlights,
    vignette: Math.round(vignette * 100) / 100,
    verdict: verdictFor(faded, clippedHighlights, vignette, mean),
  };
}

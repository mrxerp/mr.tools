/** Dithering math over grayscale planes. Deterministic, no DOM. */

export function clampGray(v: number): number {
  return Math.max(0, Math.min(255, v));
}

/** Luma plane from RGBA pixel data (alpha ignored). */
export function toGray(data: Uint8ClampedArray): Float32Array {
  const pixels = new Float32Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    pixels[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return pixels;
}

export function levelsFor(bits: number): number[] {
  const count = Math.max(2, Math.min(256, 1 << Math.max(1, Math.round(bits))));
  const levels: number[] = [];
  for (let i = 0; i < count; i++) levels.push(Math.round((i * 255) / (count - 1)));
  return levels;
}

function nearestLevel(v: number, levels: number[]): number {
  let best = levels[0];
  let bestD = Infinity;
  for (const l of levels) {
    const d = Math.abs(l - v);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best;
}

/** 4x4 Bayer matrix, row-major, used for ordered dithering. */
export const BAYER4: number[][] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function orderedDither(
  gray: Float32Array,
  width: number,
  height: number,
  bits: number,
): Float32Array {
  const levels = levelsFor(bits);
  const n = BAYER4.length;
  const out = new Float32Array(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = clampGray(gray[y * width + x]);
      let li = 0;
      while (li < levels.length - 2 && v >= levels[li + 1]) li++;
      const lo = levels[li];
      const hi = levels[li + 1];
      const t = lo + (hi - lo) * ((BAYER4[y % n][x % n] + 0.5) / (n * n));
      out[y * width + x] = v > t ? hi : lo;
    }
  }
  return out;
}

export function floydSteinberg(
  gray: Float32Array,
  width: number,
  height: number,
  bits: number,
): Float32Array {
  const levels = levelsFor(bits);
  const out = new Float32Array(gray);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const old = clampGray(out[idx]);
      const nearest = nearestLevel(old, levels);
      const err = old - nearest;
      out[idx] = nearest;
      if (x + 1 < width) out[idx + 1] += err * (7 / 16);
      if (y + 1 < height) {
        if (x > 0) out[idx + width - 1] += err * (3 / 16);
        out[idx + width] += err * (5 / 16);
        if (x + 1 < width) out[idx + width + 1] += err * (1 / 16);
      }
    }
  }
  return out;
}

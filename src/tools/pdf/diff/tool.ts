export type PixelData = Uint8ClampedArray;

export interface PixelStats {
  total: number;
  changed: number;
  pct: number;
}

export function pixelStats(a: PixelData, b: PixelData, tolerance = 16): PixelStats {
  if (a.length !== b.length)
    throw new Error("Images differ in size — render both pages at the same scale.");
  const total = a.length / 4;
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    const delta =
      Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (delta > tolerance) changed++;
  }
  return { total, changed, pct: total === 0 ? 0 : (changed / total) * 100 };
}

export function differenceMask(a: PixelData, b: PixelData, tolerance = 16): PixelData {
  if (a.length !== b.length)
    throw new Error("Images differ in size — render both pages at the same scale.");
  const mask = new Uint8ClampedArray(a.length);
  for (let i = 0; i < a.length; i += 4) {
    const delta =
      Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (delta > tolerance) {
      mask[i] = 255;
      mask[i + 3] = 255;
    }
  }
  return mask;
}

export function overlayChanges(base: PixelData, mask: PixelData): PixelData {
  const out = new Uint8ClampedArray(base);
  for (let i = 0; i < mask.length; i += 4) {
    if (mask[i + 3] > 0) {
      out[i] = 255;
      out[i + 1] = 45;
      out[i + 2] = 45;
    }
  }
  return out;
}

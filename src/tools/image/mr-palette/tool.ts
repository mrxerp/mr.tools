/** Color quantization. Deterministic, no DOM. */

export type RGB = [number, number, number];

export interface PaletteEntry {
  color: RGB;
  /** Percentage of sampled pixels this color represents (0-100, rounded). */
  share: number;
}

/** Collects opaque pixels as [r,g,b] tuples. */
export function opaquePixels(data: Uint8ClampedArray): number[][] {
  const pixels: number[][] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixels;
}

export function rgbToHex([r, g, b]: RGB): string {
  const hex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Splits pixels into `target` buckets by median cut on the widest channel. */
export function medianCutBuckets(pixels: number[][], target: number): number[][][] {
  const count = Math.max(1, Math.round(target));
  if (pixels.length === 0) return [];
  const buckets: number[][][] = [pixels];
  while (buckets.length < count) {
    let splitIdx = -1;
    let splitChannel = 0;
    let bestRange = -1;
    for (let i = 0; i < buckets.length; i++) {
      const { channel, range } = channelRange(buckets[i]);
      if (range > bestRange) {
        bestRange = range;
        splitIdx = i;
        splitChannel = channel;
      }
    }
    if (splitIdx < 0 || bestRange <= 0) break;
    const bucket = buckets[splitIdx];
    bucket.sort((a, b) => a[splitChannel] - b[splitChannel]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }
  return buckets;
}

function channelRange(bucket: number[][]): { channel: number; range: number } {
  let channel = 0;
  let range = -1;
  for (let c = 0; c < 3; c++) {
    let min = 255;
    let max = 0;
    for (const px of bucket) {
      if (px[c] < min) min = px[c];
      if (px[c] > max) max = px[c];
    }
    if (max - min > range) {
      range = max - min;
      channel = c;
    }
  }
  return { channel, range };
}

function averageColor(bucket: number[][]): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const px of bucket) {
    r += px[0];
    g += px[1];
    b += px[2];
  }
  const n = bucket.length || 1;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/** Extracts up to `count` dominant colors via median cut. */
export function medianCut(pixels: number[][], count: number): RGB[] {
  return medianCutBuckets(pixels, count).map(averageColor);
}

/** Dominant colors with the share of pixels each represents. */
export function paletteWithShare(pixels: number[][], count: number): PaletteEntry[] {
  const buckets = medianCutBuckets(pixels, count);
  const total = pixels.length || 1;
  return buckets.map((bucket) => ({
    color: averageColor(bucket),
    share: Math.round((bucket.length / total) * 100),
  }));
}

/** Uniformly samples at most `max` pixels (median cut cost guard). */
export function samplePixels(pixels: number[][], max: number): number[][] {
  const limit = Math.max(1, Math.round(max));
  if (pixels.length <= limit) return pixels;
  const step = pixels.length / limit;
  const out: number[][] = [];
  for (let i = 0; i < limit; i++) out.push(pixels[Math.min(pixels.length - 1, Math.floor(i * step))]);
  return out;
}



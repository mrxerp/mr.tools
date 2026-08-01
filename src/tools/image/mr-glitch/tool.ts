/** Seeded glitch plan generation and pixel glitch application. No DOM. */

export interface GlitchSlice {
  y: number;
  h: number;
  /** Horizontal pixel displacement of the whole band (positive = right). */
  dx: number;
  /** Extra channel split: red shifts by dx-shift, blue by dx+shift. */
  shift: number;
}

/** Deterministic PRNG (mulberry32). Same seed -> same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Generates a reproducible glitch plan for an image. intensity is 0..1. */
export function buildGlitchPlan(
  width: number,
  height: number,
  seed: number,
  intensity: number,
): GlitchSlice[] {
  const rand = mulberry32(seed);
  const k = clamp01(intensity);
  const count = 3 + Math.floor(rand() * (1 + Math.round(k * 7)));
  const maxDx = Math.max(1, Math.round(width * 0.06 * k));
  const maxShift = Math.max(1, Math.round(width * 0.08 * k));
  const slices: GlitchSlice[] = [];
  for (let i = 0; i < count; i++) {
    const maxH = Math.max(2, Math.round(height * (0.02 + 0.04 * k)));
    const h = 2 + Math.floor(rand() * Math.max(1, maxH - 1));
    const y = Math.floor(rand() * Math.max(1, height - h));
    const dx = Math.floor((rand() * 2 - 1) * maxDx);
    const shift = Math.floor((rand() * 2 - 1) * maxShift);
    slices.push({ y, h, dx, shift });
  }
  return slices;
}

/** Applies a glitch plan to RGBA pixels, returning a new buffer. */
export function applyGlitch(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  slices: GlitchSlice[],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(src);
  for (const s of slices) {
    const y0 = clampInt(s.y, 0, height - 1);
    const y1 = clampInt(s.y + s.h, 1, height);
    if (y1 <= y0) continue;
    const bandRows = y1 - y0;
    const band = new Uint8ClampedArray(bandRows * width * 4);
    for (let y = y0; y < y1; y++) {
      band.set(out.subarray(y * width * 4, (y + 1) * width * 4), (y - y0) * width * 4);
    }
    for (let y = y0; y < y1; y++) {
      const row = (y - y0) * width * 4;
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          const shift = s.dx + (c === 0 ? -s.shift : c === 2 ? s.shift : 0);
          const sx = x - shift;
          if (sx < 0 || sx >= width) continue;
          out[y * width * 4 + x * 4 + c] = band[row + sx * 4 + c];
        }
      }
    }
  }
  return out;
}

/** Pixel block averaging. Deterministic, no DOM. */

export function pixelate(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  block: number,
): Uint8ClampedArray {
  const b = Math.max(1, Math.round(block));
  const out = new Uint8ClampedArray(data.length);
  const cols = Math.ceil(width / b);
  const rows = Math.ceil(height / b);
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      const x0 = bx * b;
      const y0 = by * b;
      const x1 = Math.min(width, x0 + b);
      const y1 = Math.min(height, y0 + b);
      let r = 0;
      let g = 0;
      let bl = 0;
      let a = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          r += data[i];
          g += data[i + 1];
          bl += data[i + 2];
          a += data[i + 3];
          n++;
        }
      }
      if (n === 0) continue;
      const avg = [Math.round(r / n), Math.round(g / n), Math.round(bl / n), Math.round(a / n)];
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          out[i] = avg[0];
          out[i + 1] = avg[1];
          out[i + 2] = avg[2];
          out[i + 3] = avg[3];
        }
      }
    }
  }
  return out;
}

import { deepStrictEqual } from "node:assert";
import { pixelate } from "./tool.ts";

function rgba(pixels: number[][]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a], i) => {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = a ?? 255;
  });
  return out;
}

export async function runTest() {
  // 4x4 image: four distinct 2x2 quadrants.
  const red = [255, 0, 0, 255];
  const green = [0, 255, 0, 255];
  const blue = [0, 0, 255, 255];
  const white = [255, 255, 255, 255];
  const src = rgba([
    red, red, green, green,
    red, red, green, green,
    blue, blue, white, white,
    blue, blue, white, white,
  ]);
  const out = pixelate(src, 4, 4, 2);

  const at = (x: number, y: number) => [out[(y * 4 + x) * 4], out[(y * 4 + x) * 4 + 1], out[(y * 4 + x) * 4 + 2]];
  deepStrictEqual(at(0, 0), [255, 0, 0], "top-left block stays red");
  deepStrictEqual(at(1, 0), [255, 0, 0], "block interior filled with average");
  deepStrictEqual(at(2, 1), [0, 255, 0], "top-right block stays green");
  deepStrictEqual(at(0, 2), [0, 0, 255], "bottom-left block stays blue");
  deepStrictEqual(at(3, 3), [255, 255, 255], "bottom-right block stays white");

  // Mixed block averages to the mean.
  const mixed = rgba([[10, 0, 0, 255], [30, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255]]);
  const mixedOut = pixelate(mixed, 2, 2, 2);
  deepStrictEqual(
    [mixedOut[0], mixedOut[1], mixedOut[2]],
    [10, 0, 0],
    "2x2 mixed block averages channels",
  );

  // Odd edges: partial block at the border.
  const odd = rgba([[100, 0, 0, 255], [0, 0, 0, 255], [0, 0, 0, 255]]);
  const oddOut = pixelate(odd, 3, 1, 2);
  deepStrictEqual([oddOut[0], oddOut[1], oddOut[2]], [50, 0, 0], "partial edge block averages");
  deepStrictEqual(
    [oddOut[4], oddOut[5], oddOut[6]],
    [50, 0, 0],
    "second pixel of the partial block",
  );
  deepStrictEqual(
    [oddOut[8], oddOut[9], oddOut[10]],
    [0, 0, 0],
    "single-pixel trailing block",
  );
}

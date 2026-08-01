import { deepStrictEqual, strictEqual } from "node:assert";
import {
  opaquePixels,
  rgbToHex,
  medianCut,
  paletteWithShare,
  samplePixels,
} from "./tool.ts";

export async function runTest() {
  strictEqual(rgbToHex([0, 128, 255]), "#0080ff");
  strictEqual(rgbToHex([255, 255, 255]), "#ffffff");
  strictEqual(rgbToHex([260, -5, 10]), "#ff000a", "clamps out-of-range");

  const opaque = new Uint8ClampedArray([
    10, 20, 30, 255,
    40, 50, 60, 255,
    0, 0, 0, 0,
    70, 80, 90, 128,
  ]);
  deepStrictEqual(opaquePixels(opaque), [
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
  ], "drops fully transparent pixels, keeps semi-opaque");

  const few = medianCut([[0, 0, 0], [255, 0, 0], [0, 255, 0]], 5);
  const fewSorted = [...few].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  deepStrictEqual(
    fewSorted,
    [
      [0, 0, 0],
      [0, 255, 0],
      [255, 0, 0],
    ],
    "fewer distinct colors than target stays exact (order-insensitive)",
  );

  const merged = medianCut(
    [[20, 20, 20], [22, 22, 22], [21, 21, 21], [240, 240, 240], [245, 245, 245], [235, 235, 235]],
    2,
  );
  strictEqual(merged.length, 2, "two buckets");
  const [dark, light] = [...merged].sort((a, b) => a[0] - b[0]);
  deepStrictEqual(dark, [21, 21, 21], "near-black cluster averaged");
  deepStrictEqual(light, [240, 240, 240], "near-white cluster averaged");

  const withShare = paletteWithShare(
    [[0, 0, 0], [0, 0, 0], [0, 0, 0], [255, 255, 255]],
    2,
  );
  const totalShare = withShare.reduce((s, e) => s + e.share, 0);
  strictEqual(totalShare, 100, "shares sum to 100");

  deepStrictEqual(samplePixels([[1], [2], [3], [4]], 2), [[1], [3]], "even sampling");
  deepStrictEqual(samplePixels([[1], [2]], 5), [[1], [2]], "below cap unchanged");
}

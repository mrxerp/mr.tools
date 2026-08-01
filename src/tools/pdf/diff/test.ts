import { strictEqual, rejects } from "node:assert";
import { pixelStats, differenceMask, overlayChanges } from "./tool.ts";

function solid(r: number, g: number, b: number, width = 2, height = 2): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

export async function runTest() {
  const white = solid(255, 255, 255);
  const black = solid(0, 0, 0);

  const identical = pixelStats(white, white);
  strictEqual(identical.changed, 0, "identical images have no changes");
  strictEqual(identical.pct, 0, "identical images are 0% changed");
  strictEqual(identical.total, 4, "pixel count matches");

  const all = pixelStats(white, black);
  strictEqual(all.changed, 4, "inverted image changes every pixel");
  strictEqual(all.pct, 100, "inverted image is 100% changed");

  const half = new Uint8ClampedArray(white);
  half[0] = 0;
  half[1] = 0;
  half[2] = 0;
  const one = pixelStats(white, half);
  strictEqual(one.changed, 1, "single changed pixel detected");
  strictEqual(one.pct, 25, "single changed pixel is 25%");

  const small = solid(255, 255, 255, 1, 1);
  const smallBlack = solid(0, 0, 0, 1, 1);
  const mask = differenceMask(small, smallBlack);
  strictEqual(mask[0], 255, "changed pixel is marked red");
  strictEqual(mask[3], 255, "changed pixel is opaque");
  const clear = differenceMask(small, small);
  strictEqual(clear[3], 0, "unchanged pixel is transparent");

  const overlay = overlayChanges(white, differenceMask(white, black));
  strictEqual(overlay[0], 255, "overlay keeps red highlight");
  strictEqual(overlay[1], 45, "overlay fixes green highlight channel");

  await rejects(async () => pixelStats(solid(0, 0, 0, 1, 1), solid(0, 0, 0, 2, 2)), /differ in size/, "size mismatch rejects");
}

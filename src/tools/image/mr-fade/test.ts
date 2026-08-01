import { strictEqual } from "node:assert";
import { brightnessHistogram, vignetteRatio, analyzeFade } from "./tool.ts";

function gray(pixels: number[]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach((v, i) => {
    out[i * 4] = v;
    out[i * 4 + 1] = v;
    out[i * 4 + 2] = v;
    out[i * 4 + 3] = 255;
  });
  return out;
}

export async function runTest() {
  const hist = brightnessHistogram(gray([0, 255]));
  strictEqual(hist[0], 1, "one black pixel at bucket 0");
  strictEqual(hist[255], 1, "one white pixel at bucket 255");
  strictEqual(hist.reduce((a, b) => a + b, 0), 2, "histogram totals pixel count");

  const midGray = gray([128, 128]);
  const rep = analyzeFade(midGray, 2, 1);
  strictEqual(rep.mean, 128, "mean brightness");
  strictEqual(rep.faded, false, "flat mid-gray is not faded");
  strictEqual(rep.clipped, false, "flat mid-gray is not clipped");
  strictEqual(rep.vignette, 1, "uniform image has no vignette");
  strictEqual(rep.verdict, "no strong fading signs detected");

  const allWhite = analyzeFade(gray([255, 255, 255, 255]), 2, 2);
  strictEqual(allWhite.clipped, true, "all-white image is clipped");
  strictEqual(allWhite.clippedPct, 100, "clipped percentage is 100");

  // Faded: washed midtones with no true blacks.
  const washed = analyzeFade(gray([60, 90, 120, 150]), 2, 2);
  strictEqual(washed.faded, true, "no pixels below 10 -> faded");
  strictEqual(washed.blackPct, 0, "zero true blacks");

  // 3x3 vignette: bright center, dark corners.
  const vig = gray([
    25, 100, 25,
    100, 200, 100,
    25, 100, 25,
  ]);
  const ratio = vignetteRatio(vig, 3, 3);
  strictEqual(ratio < 0.85, true, `corners clearly dimmer (ratio ${ratio})`);
  const vigRep = analyzeFade(vig, 3, 3);
  strictEqual(vigRep.verdict.includes("vignette"), true, "vignette reported");
}

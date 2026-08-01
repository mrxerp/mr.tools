import { strictEqual, ok } from "node:assert";
import { rmsLevel, peakLevel, toDb, isClipping, estimateNoiseFloor } from "./tool.ts";

export async function runTest() {
  const amp = 0.5;
  const sine = new Float32Array(48000).map((_, i) => amp * Math.sin((2 * Math.PI * 440 * i) / 48000));
  ok(Math.abs(rmsLevel(sine) - amp / Math.SQRT2) < 1e-3, "RMS of a sine is amplitude / sqrt(2)");
  ok(Math.abs(peakLevel(sine) - amp) < 1e-3, "peak of a sine is its amplitude");

  strictEqual(rmsLevel(new Float32Array(0)), 0, "empty buffer RMS is 0");
  strictEqual(peakLevel(new Float32Array(0)), 0, "empty buffer peak is 0");

  ok(Math.abs(toDb(1) - 0) < 1e-9, "0 dB at full scale");
  ok(Math.abs(toDb(0.1) + 20) < 1e-9, "0.1 amplitude is -20 dB");
  strictEqual(toDb(0), -Infinity, "silence maps to -Infinity");

  strictEqual(isClipping(1.0), true, "full-scale peaks clip");
  strictEqual(isClipping(0.5), false, "half-scale peaks do not clip");
  strictEqual(isClipping(0.995), true, "near-full-scale peaks clip with default threshold");

  const history = [10, 11, 9, 10, 12, 50, 60];
  strictEqual(estimateNoiseFloor(history), 9, "noise floor is the low percentile");
  strictEqual(estimateNoiseFloor([]), 0, "no history -> 0");
}

import { strictEqual, ok } from "node:assert";
import {
  noteFrequency,
  noteForFrequency,
  generateTone,
  generateSweep,
  estimatedFrequency,
  TONE_PRESETS,
} from "./tool.ts";

export async function runTest() {
  strictEqual(noteFrequency("A4"), 440, "A4 is 440 Hz");
  ok(Math.abs(noteFrequency("A3") - 220) < 0.01, "A3 is 220 Hz");
  ok(Math.abs(noteFrequency("C4") - 261.63) < 0.5, "C4 is middle C");
  ok(Math.abs(noteFrequency("E2") - 82.41) < 0.5, "E2 is the low guitar string");
  strictEqual(noteForFrequency(440), "A4");
  strictEqual(noteForFrequency(261.63), "C4");
  ok(TONE_PRESETS.length >= 5, "presets exist");

  const rate = 44100;
  const sine = generateTone(440, 1, rate, "sine");
  ok(Math.abs(estimatedFrequency(sine, rate) - 440) < 8, "sine comes back near 440 Hz");

  const square = generateTone(1000, 0.2, rate, "square");
  ok(Math.abs(estimatedFrequency(square, rate) - 1000) < 20, "square zero crossings still give 1 kHz");

  const noise = generateTone(0, 0.1, rate, "noise");
  let sum = 0;
  for (const s of noise) {
    ok(s >= -1 && s <= 1, "noise stays in [-1, 1]");
    sum += s;
  }
  ok(Math.abs(sum / noise.length) < 0.1, "noise mean is near zero");

  const sweep = generateSweep(200, 2000, 1, rate);
  const startHalf = sweep.slice(0, Math.floor(sweep.length / 2));
  ok(estimatedFrequency(startHalf, rate) < 1000, "sweep starts low and rises");

  ok(generateTone(440, 0, rate, "sine").length >= 1, "zero-length duration still yields samples");
}

import { strictEqual, ok } from "node:assert";
import { detectBpm, dominantBpm, onsetIntervals, tapToBpm } from "./tool.ts";

function syntheticTrack(rate: number, bpm: number, seconds: number, beatMs: number): Float32Array {
  const out = new Float32Array(Math.round(rate * seconds));
  const periodS = 60 / bpm;
  const beatSamples = Math.round((beatMs / 1000) * rate);
  for (let beat = 0; beat < seconds / periodS; beat++) {
    const base = Math.round(beat * periodS * rate);
    for (let i = 0; i < beatSamples && base + i < out.length; i++) {
      out[base + i] = Math.sin((2 * Math.PI * 440 * i) / rate);
    }
  }
  return out;
}

export async function runTest() {
  const rate = 44100;
  const track = syntheticTrack(rate, 120, 9, 100);
  const bpm = detectBpm(track, rate);
  ok(Math.abs(bpm - 120) <= 4, `synthetic 120 BPM track detected as ${bpm}`);

  const slow = syntheticTrack(rate, 90, 9, 100);
  const bpm2 = detectBpm(slow, rate);
  ok(Math.abs(bpm2 - 90) <= 4, `synthetic 90 BPM track detected as ${bpm2}`);

  strictEqual(dominantBpm([0.5, 0.5, 0.5]), 120, "0.5s intervals are 120 BPM");
  strictEqual(dominantBpm([1.0]), 60, "1s interval is 60 BPM");
  strictEqual(dominantBpm([0.25, 0.5]), 120, "0.25s folds up to 120 BPM");
  strictEqual(dominantBpm([]), 0, "no intervals -> 0");

  const iv = onsetIntervals([10, 100], 256, 44100)[0];
  ok(Math.abs(iv - 23040 / 44100) < 1e-9, "interval math is hop * delta / rate");

  strictEqual(tapToBpm([0, 500, 1000, 1500]), 120, "tap at 0.5s -> 120 BPM");
  strictEqual(tapToBpm([0, 1000]), 60, "tap at 1s -> 60 BPM");
  strictEqual(tapToBpm([0]), 0, "one tap is not enough");
  strictEqual(tapToBpm([0, 100, 200]), 0, "too-fast taps are rejected");
}

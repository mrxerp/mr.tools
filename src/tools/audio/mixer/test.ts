import { strictEqual, ok } from "node:assert";
import { panGain, fadeSamples, mixTracks, encodeWav, wavInfo } from "./tool.ts";

export async function runTest() {
  const center = panGain(0);
  ok(Math.abs(center.left - Math.SQRT1_2) < 1e-9 && Math.abs(center.right - Math.SQRT1_2) < 1e-9, "pan 0 is equal power");
  const left = panGain(-1);
  ok(left.left > 0.999 && left.right < 1e-9, "pan -1 is hard left");
  const right = panGain(1);
  ok(right.left < 1e-9 && right.right > 0.999, "pan +1 is hard right");

  const rate = 1000;
  const a = new Float32Array([1, 1, 1, 1]);
  const faded = fadeSamples(a, 0.002, 0.002, rate);
  ok(Math.abs(faded[0]) < 1e-9, "fade-in starts at zero");
  ok(Math.abs(faded[3]) < 1e-9, "fade-out ends at zero");
  ok(Math.abs(faded[1] - 0.5) < 1e-9, "linear fade midpoint");

  const settings = { volume: 1, pan: 0, fadeInSec: 0, fadeOutSec: 0 };
  const mixed = mixTracks(a, new Float32Array([0, 0, 0, 0]), rate, settings, { ...settings, volume: 0 });
  ok(Math.abs(mixed[0] - Math.SQRT1_2) < 1e-6 && Math.abs(mixed[1] - Math.SQRT1_2) < 1e-6, "track A panned center lands in both channels");

  const mixedSum = mixTracks(new Float32Array([1]), new Float32Array([1]), rate, settings, settings);
  ok(Math.abs(mixedSum[0] - Math.SQRT1_2 * 2) < 1e-6, "two center tracks add");

  const wav = encodeWav(mixed, rate, 2);
  strictEqual(wavInfo(wav).numChannels, 2, "mixed output encodes as stereo WAV");
}

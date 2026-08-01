import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { encodeWav, wavInfo, clampRange, samplePeaks, formatDuration } from "./tool.ts";

export async function runTest() {
  const rate = 8000;
  const mono = new Float32Array([0, 0.5, -0.5, 1, -1, 0.25]);
  const wav = encodeWav(mono, rate, 1);
  const info = wavInfo(wav);
  strictEqual(info.sampleRate, rate);
  strictEqual(info.numChannels, 1);
  strictEqual(info.bytesPerSample, 2);
  strictEqual(info.dataLength, mono.length * 2, "16-bit PCM payload size");
  strictEqual(wav.byteLength, 44 + info.dataLength, "44-byte header + payload");

  const stereo = encodeWav(new Float32Array([0.1, -0.2, 0.3, -0.4]), rate, 2);
  strictEqual(wavInfo(stereo).numChannels, 2);
  strictEqual(wavInfo(stereo).dataLength, 4 * 2, "2ch frames of 2 samples each");

  deepStrictEqual(clampRange(10, 2, 8), { start: 2, end: 8 });
  deepStrictEqual(clampRange(10, -1, 20), { start: 0, end: 10 });
  deepStrictEqual(clampRange(10, 5, 3), { start: 5, end: 5 }, "start > end collapses");
  deepStrictEqual(clampRange(0, 1, 2), { start: 0, end: 0 });

  const peaks = samplePeaks(mono, 3);
  strictEqual(peaks.length, 3);
  strictEqual(peaks[0], 128, "first bucket peak 0.5 -> 128");
  strictEqual(peaks[1], 255, "second bucket peak 1.0 -> 255");
  strictEqual(samplePeaks(new Float32Array(0), 4).length, 4, "empty input yields empty peaks");

  strictEqual(formatDuration(1.234), "1.23s");
  strictEqual(formatDuration(0), "0.00s");
  ok(encodeWav(new Float32Array([2, -2]), rate, 1).byteLength === 48, "out-of-range samples clamp without corrupting size");
}

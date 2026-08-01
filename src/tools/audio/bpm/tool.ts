/** Simple energy-based onset detection + tap-tempo math. Pure TS, no browser APIs. */

const HOP = 256;

export function detectBpm(
  samples: Float32Array,
  sampleRate: number,
  minBpm = 60,
  maxBpm = 200,
): number {
  const energies = energyPerHop(samples, HOP);
  const minSep = Math.max(4, Math.round(((60 / maxBpm) * sampleRate) / HOP));
  const onsets = pickOnsets(energies, minSep);
  const intervals = onsetIntervals(onsets, HOP, sampleRate);
  return dominantBpm(intervals, minBpm, maxBpm);
}

/** RMS energy per fixed-size hop, downsampled by HOP. */
export function energyPerHop(samples: Float32Array, hop = HOP): Float32Array {
  const out = new Float32Array(Math.max(1, Math.ceil(samples.length / hop)));
  for (let i = 0; i < samples.length; i++) out[Math.floor(i / hop)] += samples[i] * samples[i];
  for (let i = 0; i < out.length; i++) out[i] = Math.sqrt(out[i] / hop);
  return out;
}

/** Rising-edge onsets: energy jumps above mean + half a std, minSep hops apart. */
export function pickOnsets(energies: Float32Array, minSeparation = 8): number[] {
  if (energies.length < 3) return [];
  let sum = 0;
  for (const e of energies) sum += e;
  const mean = sum / energies.length;
  let sq = 0;
  for (const e of energies) sq += (e - mean) ** 2;
  const threshold = mean + 0.5 * Math.sqrt(sq / energies.length);
  const onsets: number[] = [];
  for (let i = 1; i < energies.length; i++) {
    if (energies[i] < threshold) continue;
    if (energies[i] <= energies[i - 1]) continue;
    if (onsets.length && i - onsets[onsets.length - 1] < minSeparation) continue;
    onsets.push(i);
  }
  return onsets;
}

/** Seconds between consecutive onsets. */
export function onsetIntervals(onsets: number[], hop = HOP, sampleRate = 44100): number[] {
  const out: number[] = [];
  for (let i = 1; i < onsets.length; i++) out.push(((onsets[i] - onsets[i - 1]) * hop) / sampleRate);
  return out;
}

/** Histograms intervals folded into the [minBpm, maxBpm] range and returns the mode. */
export function dominantBpm(intervals: number[], minBpm = 60, maxBpm = 200): number {
  const bin = new Map<number, number>();
  let bestBpm = 0;
  let bestCount = 0;
  for (const iv of intervals) {
    if (iv <= 0) continue;
    let bpm = 60 / iv;
    while (bpm < minBpm) bpm *= 2;
    while (bpm > maxBpm) bpm /= 2;
    if (bpm < minBpm || bpm > maxBpm) continue;
    const key = Math.round(bpm);
    const c = (bin.get(key) ?? 0) + 1;
    bin.set(key, c);
    if (c > bestCount) {
      bestCount = c;
      bestBpm = key;
    }
  }
  return bestBpm;
}

/** Median interval between successive taps (timestamps in ms) -> BPM. */
export function tapToBpm(tapsMs: number[], minBpm = 40, maxBpm = 300): number {
  if (tapsMs.length < 2) return 0;
  const intervals: number[] = [];
  for (let i = 1; i < tapsMs.length; i++) {
    const d = tapsMs[i] - tapsMs[i - 1];
    if (d >= 60000 / maxBpm && d <= 60000 / minBpm) intervals.push(d);
  }
  if (!intervals.length) return 0;
  const sorted = [...intervals].sort((a, b) => a - b);
  return Math.round(60000 / sorted[Math.floor(sorted.length / 2)]);
}

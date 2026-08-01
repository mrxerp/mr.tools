/** RMS/peak level math for mic metering. Pure TS, no browser APIs. */

export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function peakLevel(samples: Float32Array): number {
  let p = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > p) p = a;
  }
  return p;
}

export function toDb(x: number): number {
  return x > 0 ? 20 * Math.log10(x) : -Infinity;
}

export function isClipping(peak: number, threshold = 0.99): boolean {
  return peak >= threshold;
}

/** Low-percentile RMS as a noise-floor estimate (pass raw history, unsorted). */
export function estimateNoiseFloor(rmsHistory: number[]): number {
  if (!rmsHistory.length) return 0;
  const sorted = [...rmsHistory].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.1))];
}

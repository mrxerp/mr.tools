/** Phase-cancellation math for center-channel removal/isolation. Pure TS. */

export function centerCancel(left: Float32Array, right: Float32Array) {
  const n = Math.min(left.length, right.length);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (left[i] - right[i]) * 0.5;
  return out;
}

export function centerIsolate(left: Float32Array, right: Float32Array) {
  const n = Math.min(left.length, right.length);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (left[i] + right[i]) * 0.5;
  return out;
}

export function sumAbs(samples: Float32Array): number {
  let s = 0;
  for (let i = 0; i < samples.length; i++) s += Math.abs(samples[i]);
  return s;
}

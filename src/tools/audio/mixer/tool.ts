import { encodeWav, wavInfo } from "../_wav.ts";

export { encodeWav, wavInfo };

export interface MixSettings {
  volume: number;
  pan: number;
  fadeInSec: number;
  fadeOutSec: number;
}

export function panGain(pan: number): { left: number; right: number } {
  const p = Math.max(-1, Math.min(1, pan));
  const angle = ((p + 1) / 2) * (Math.PI / 2);
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

export function fadeSamples(
  samples: Float32Array,
  fadeInSec: number,
  fadeOutSec: number,
  sampleRate: number,
): Float32Array {
  const out = samples.slice();
  const fi = Math.min(out.length, Math.round(Math.max(0, fadeInSec) * sampleRate));
  const fo = Math.min(out.length, Math.round(Math.max(0, fadeOutSec) * sampleRate));
  for (let i = 0; i < fi; i++) out[i] *= fi > 0 ? i / fi : 1;
  for (let i = 0; i < fo; i++) out[out.length - 1 - i] *= fo > 0 ? i / fo : 1;
  return out;
}

export function mixTracks(
  a: Float32Array,
  b: Float32Array,
  sampleRate: number,
  sa: MixSettings,
  sb: MixSettings,
): Float32Array {
  const fa = fadeSamples(a, sa.fadeInSec, sa.fadeOutSec, sampleRate);
  const fb = fadeSamples(b, sb.fadeInSec, sb.fadeOutSec, sampleRate);
  const len = Math.max(fa.length, fb.length);
  const out = new Float32Array(len * 2);
  const ga = panGain(sa.pan);
  const gb = panGain(sb.pan);
  for (let i = 0; i < len; i++) {
    const la = i < fa.length ? fa[i] * sa.volume * ga.left : 0;
    const ra = i < fa.length ? fa[i] * sa.volume * ga.right : 0;
    const lb = i < fb.length ? fb[i] * sb.volume * gb.left : 0;
    const rb = i < fb.length ? fb[i] * sb.volume * gb.right : 0;
    out[i * 2] = la + lb;
    out[i * 2 + 1] = ra + rb;
  }
  return out;
}

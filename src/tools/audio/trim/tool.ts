import { encodeWav, wavInfo } from "../_wav.ts";

export { encodeWav, wavInfo };

export function clampRange(
  durationSec: number,
  startSec: number,
  endSec: number,
): { start: number; end: number } {
  if (durationSec <= 0) return { start: 0, end: 0 };
  const start = Math.max(0, Math.min(durationSec, startSec));
  const end = Math.max(start, Math.min(durationSec, endSec));
  return { start, end };
}

export interface CutSegment {
  offset: number;
  start: number;
  dur: number;
}

/** Splits the clip into the pieces the output will keep.
    keep: keep [start, end]; remove: keep [0, start] + [end, duration]. */
export function cutSegments(
  durationSec: number,
  startSec: number,
  endSec: number,
  remove: boolean,
): CutSegment[] {
  const { start, end } = clampRange(durationSec, startSec, endSec);
  if (!remove) return [{ offset: 0, start, dur: end - start }];
  const segs: CutSegment[] = [];
  if (start > 0) segs.push({ offset: 0, start: 0, dur: start });
  const tail = durationSec - end;
  if (tail > 0) segs.push({ offset: start, start: end, dur: tail });
  return segs;
}

export function outputDuration(
  durationSec: number,
  startSec: number,
  endSec: number,
  remove: boolean,
): number {
  return cutSegments(durationSec, startSec, endSec, remove).reduce((acc, s) => acc + s.dur, 0);
}

/** Downsamples a mono signal into N peak values (0-255) for a waveform canvas. */
export function samplePeaks(samples: Float32Array, buckets: number): Uint8Array {
  const out = new Uint8Array(Math.max(0, buckets));
  if (!samples.length || out.length === 0) return out;
  const per = Math.max(1, Math.ceil(samples.length / out.length));
  for (let b = 0; b < out.length; b++) {
    const start = b * per;
    const end = Math.min(samples.length, start + per);
    let peak = 0;
    for (let i = start; i < end; i++) {
      const a = Math.abs(samples[i]);
      if (a > peak) peak = a;
    }
    out[b] = Math.min(255, Math.round(peak * 255));
  }
  return out;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec * 100) / 100);
  return `${s.toFixed(2)}s`;
}

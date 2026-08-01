import { noteToFrequency, frequencyToNote } from "../_notes.ts";

export type Waveform = "sine" | "square" | "triangle" | "sawtooth" | "noise";

export interface TonePreset {
  name: string;
  freq: number;
}

export const TONE_PRESETS: TonePreset[] = [
  { name: "100 Hz (bass)", freq: 100 },
  { name: "A4 (440 Hz concert pitch)", freq: 440 },
  { name: "C4 (middle C)", freq: 261.63 },
  { name: "1 kHz (reference)", freq: 1000 },
  { name: "8 kHz (air/high freq)", freq: 8000 },
];

export function noteFrequency(note: string): number {
  return noteToFrequency(note);
}

export function noteForFrequency(freq: number): string {
  const { note, cents } = frequencyToNote(freq);
  return cents === 0 ? note : `${note} (${cents >= 0 ? "+" : ""}${cents}¢)`;
}

export function generateTone(
  freq: number,
  durationSec: number,
  sampleRate: number,
  waveform: Waveform,
) {
  const n = Math.max(1, Math.round(durationSec * sampleRate));
  const out = new Float32Array(n);
  const phaseStep = (2 * Math.PI * freq) / sampleRate;
  for (let i = 0; i < n; i++) {
    const t = phaseStep * i;
    switch (waveform) {
      case "sine":
        out[i] = Math.sin(t);
        break;
      case "square":
        out[i] = Math.sin(t) >= 0 ? 1 : -1;
        break;
      case "triangle":
        out[i] = (2 / Math.PI) * Math.asin(Math.sin(t));
        break;
      case "sawtooth":
        out[i] = 2 * ((t / (2 * Math.PI)) % 1) - 1;
        break;
      case "noise":
        out[i] = Math.random() * 2 - 1;
        break;
    }
  }
  return out;
}

export function generateSweep(
  fromFreq: number,
  toFreq: number,
  durationSec: number,
  sampleRate: number,
  exponential = true,
): Float32Array {
  const n = Math.max(1, Math.round(durationSec * sampleRate));
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = exponential
      ? fromFreq * Math.pow(toFreq / fromFreq, t)
      : fromFreq + (toFreq - fromFreq) * t;
    phase += (2 * Math.PI * f) / sampleRate;
    out[i] = Math.sin(phase);
  }
  return out;
}

export function sineZeroCrossings(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1] < 0 && samples[i] >= 0) crossings++;
  }
  return crossings;
}

export function estimatedFrequency(samples: Float32Array, sampleRate: number): number {
  return (sineZeroCrossings(samples) * sampleRate) / Math.max(1, samples.length);
}

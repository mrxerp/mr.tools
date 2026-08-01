/** Shared pure-TS note name <-> frequency math. No browser APIs. */

export const SEMITONES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteClass(note: string): number {
  const m = note.trim().match(/^([A-G])(#|b)?(\d)?$/i);
  if (!m) throw new Error(`invalid note: ${note}`);
  let idx = SEMITONES.indexOf(m[1].toUpperCase());
  const acc = m[2]?.toLowerCase();
  if (acc === "#") idx += 1;
  if (acc === "b") idx -= 1;
  return ((idx % 12) + 12) % 12;
}

export function noteName(pitchClass: number): string {
  return SEMITONES[((pitchClass % 12) + 12) % 12];
}

/** A4 = 440 Hz reference; each octave doubles, each semitone multiplies by 2^(1/12). */
export function noteToFrequency(note: string): number {
  const m = note.trim().match(/^([A-G])(#|b)?(\d+)$/i);
  if (!m) throw new Error(`invalid note (need an octave, e.g. "A4"): ${note}`);
  const pc = noteClass(m[1] + (m[2] ?? ""));
  const octave = parseInt(m[3], 10);
  return 440 * Math.pow(2, octave - 4 + (pc - 9) / 12);
}

export function frequencyToNote(freq: number): { note: string; cents: number } {
  if (freq <= 0) throw new Error("frequency must be positive");
  const midi = 69 + 12 * Math.log2(freq / 440);
  const nearest = Math.round(midi);
  const cents = Math.round((midi - nearest) * 100);
  const pc = ((nearest % 12) + 12) % 12;
  const octave = Math.floor(nearest / 12) - 1;
  return { note: `${SEMITONES[pc]}${octave}`, cents };
}

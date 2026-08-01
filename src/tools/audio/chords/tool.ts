import { noteClass, noteName, noteToFrequency } from "../_notes.ts";

export type ChordQuality =
  | "major"
  | "minor"
  | "7"
  | "maj7"
  | "m7"
  | "sus2"
  | "sus4"
  | "dim"
  | "aug"
  | "add9";

export const QUALITY_SYMBOLS: Record<ChordQuality, string> = {
  major: "",
  minor: "m",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  sus2: "sus2",
  sus4: "sus4",
  dim: "dim",
  aug: "aug",
  add9: "add9",
};

export const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
};

/** Open-note pitch classes, low to high string. */
const GUITAR = [4, 9, 2, 7, 11, 4];
const UKULELE = [7, 0, 4, 9];

export function chordTones(root: string, quality: ChordQuality): string[] {
  const rootPc = noteClass(root);
  return QUALITY_INTERVALS[quality].map((iv) => noteName(rootPc + iv));
}

export function chordSymbol(root: string, quality: ChordQuality): string {
  return `${noteName(noteClass(root))}${QUALITY_SYMBOLS[quality]}`;
}

/**
 * Finds a tight voicing where every fretted string plays a chord tone.
 * Bass strings may be muted; the lowest fret is preferred (open position).
 */
export function chordDiagram(
  root: string,
  quality: ChordQuality,
  instrument: "guitar" | "ukulele" = "guitar",
): { frets: number[]; label: string; tones: string[] } {
  const tuning = instrument === "guitar" ? GUITAR : UKULELE;
  const maxMute = instrument === "guitar" ? 2 : 0;
  const tones = chordTones(root, quality);
  const toneSet = new Set<number>(tones.map((n) => noteClass(n)));

  let best: { frets: number[]; span: number; base: number; score: number } | null = null;
  for (let base = 0; base <= 12; base++) {
    const maxFret = base + 5;
    const frets: number[] = [];
    let ok = true;
    for (let s = 0; s < tuning.length; s++) {
      let choice = -1;
      for (let f = base; f <= maxFret; f++) {
        if (toneSet.has((tuning[s] + f) % 12)) {
          choice = f;
          break;
        }
      }
      if (choice === -1 && s < maxMute) {
        frets.push(-1);
        continue;
      }
      if (choice === -1) {
        ok = false;
        break;
      }
      frets.push(choice);
    }
    if (!ok) continue;
    const played = frets.filter((f) => f >= 0);
    if (!played.length) continue;
    const span = Math.max(...played) - Math.min(...played);
    const score = span <= 3 ? base : 100 + span * 10 + base;
    if (!best || score < best.score) {
      best = { frets, span, base, score };
    }
  }
  if (!best) throw new Error(`no voicing for ${root} ${quality}`);
  return { frets: best.frets, label: chordSymbol(root, quality), tones };
}

/** Chord tone frequencies for playback, root in the bass. */
export function chordFrequencies(root: string, quality: ChordQuality): number[] {
  const rootPc = noteClass(root);
  return QUALITY_INTERVALS[quality].map((iv) => {
    const octave = 4 + Math.floor((rootPc + iv) / 12);
    return noteToFrequency(`${noteName(rootPc + iv)}${octave}`);
  });
}

import { strictEqual, ok } from "node:assert";
import { chordTones, chordDiagram, chordFrequencies, chordSymbol } from "./tool.ts";

export async function runTest() {
  strictEqual(chordSymbol("C", "major"), "C");
  strictEqual(chordSymbol("A", "minor"), "Am");
  strictEqual(chordSymbol("G", "7"), "G7");

  deepTones("C", "major", ["C", "E", "G"]);
  deepTones("A", "minor", ["A", "C", "E"]);
  deepTones("G", "7", ["G", "B", "D", "F"]);
  deepTones("D", "sus2", ["D", "E", "A"]);

  const cMajor = chordDiagram("C", "major", "guitar");
  strictEqual(cMajor.label, "C");
  strictEqual(cMajor.frets.length, 6);
  for (let s = 0; s < cMajor.frets.length; s++) {
    const fret = cMajor.frets[s];
    if (fret < 0) continue;
    const open = [4, 9, 2, 7, 11, 4][s];
    ok(cMajor.tones.includes(noteToName((open + fret) % 12)), `fretted note is in the chord`);
  }
  deepStrictEqualish(cMajor.frets, [0, 3, 2, 0, 1, 0], "C major resolves to the open C shape");

  const am = chordDiagram("A", "minor", "guitar");
  deepStrictEqualish(am.frets, [0, 0, 2, 2, 1, 0], "A minor resolves to the open Am shape");

  const cUke = chordDiagram("C", "major", "ukulele");
  strictEqual(cUke.frets.length, 4);
  deepStrictEqualish(cUke.frets, [0, 0, 0, 3], "C major on ukulele is 0003");

  const fMajor = chordFrequencies("F", "major");
  ok(Math.abs(fMajor[0] - 349.23) < 1, "F root around 349 Hz");
  strictEqual(fMajor.length, 3, "major triad has 3 notes");

  strictEqual(chordTones("C", "major").length, 3);
}

function deepTones(root: string, quality: Parameters<typeof chordTones>[1], expected: string[]) {
  strictEqual(JSON.stringify(chordTones(root, quality)), JSON.stringify(expected));
}

function deepStrictEqualish(actual: number[], expected: number[], msg: string) {
  strictEqual(JSON.stringify(actual), JSON.stringify(expected), msg);
}

function noteToName(pc: number): string {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((pc % 12) + 12) % 12];
}

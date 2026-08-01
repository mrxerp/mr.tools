import { deepStrictEqual, strictEqual } from "node:assert";
import { countSyllables, splitWord, syllabify, totalSyllables } from "./tool.ts";

export async function runTest() {
  strictEqual(countSyllables("cat"), 1);
  strictEqual(countSyllables("hello"), 2);
  strictEqual(countSyllables("cake"), 1, "silent e");
  strictEqual(countSyllables("table"), 2, "le ending keeps its vowel");
  strictEqual(countSyllables("everything"), 4, "override");

  deepStrictEqual(splitWord("hello"), ["hel", "lo"]);
  deepStrictEqual(splitWord("banana"), ["ba", "na", "na"]);
  deepStrictEqual(splitWord("amazing"), ["a", "ma", "zing"]);
  deepStrictEqual(splitWord("computer"), ["com", "pu", "ter"]);
  deepStrictEqual(splitWord("simplicity"), ["sim", "pli", "ci", "ty"]);
  deepStrictEqual(splitWord("make"), ["make"], "silent e merges back");
  deepStrictEqual(splitWord("table"), ["ta", "ble"]);
  deepStrictEqual(splitWord("a"), ["a"]);

  for (const w of ["hello", "banana", "programming", "elephant"]) {
    strictEqual(splitWord(w).length, countSyllables(w), `${w} split count matches`);
    strictEqual(splitWord(w).join(""), w, `${w} rejoins to the word`);
  }

  const words = syllabify("hello world");
  strictEqual(words.length, 2);
  strictEqual(words[0].word, "hello");
  strictEqual(words[0].count, 2);
  strictEqual(totalSyllables("cat dog"), 2);
}

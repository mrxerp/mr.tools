import { strictEqual } from "node:assert";
import { analyze, countSentences, countSyllables, countWords, flesch, fleschLabel, gunningFog } from "./tool.ts";

export async function runTest() {
  strictEqual(countWords("  a  b c "), 3, "three words");
  strictEqual(countWords(""), 0, "empty input");
  strictEqual(countSentences("Hello world. Goodbye."), 2, "two sentences");
  strictEqual(countSentences("no punctuation"), 1, "one implicit sentence");
  strictEqual(countSyllables("hello"), 2);
  strictEqual(countSyllables("cat"), 1);
  strictEqual(countSyllables("cake"), 1);

  const s = analyze("The quick brown fox jumps over the lazy dog.");
  strictEqual(s.words, 9);
  strictEqual(s.sentences, 1);
  strictEqual(s.chars, 44);
  strictEqual(s.paragraphs, 1);
  strictEqual(s.readingMinutes, 0);
  strictEqual(s.speakingSeconds, Math.round((9 / 130) * 60));
  strictEqual(typeof s.flesch, "number", "flesch computed");
  strictEqual(typeof s.fog, "number", "fog computed");

  strictEqual(fleschLabel(95), "Very easy");
  strictEqual(fleschLabel(85), "Easy");
  strictEqual(fleschLabel(65), "Standard");
  strictEqual(fleschLabel(45), "Difficult");
  strictEqual(fleschLabel(10), "Very difficult");
  strictEqual(flesch(100, 5, 150), 206.835 - 1.015 * 20 - 84.6 * 1.5, "flesch formula");
  strictEqual(gunningFog(100, 5, 20), 0.4 * (20 + 100 * 0.2), "gunning fog formula");

  const empty = analyze("");
  strictEqual(empty.words, 0);
  strictEqual(empty.flesch, null);
  strictEqual(empty.fog, null);
  strictEqual(empty.avgWordLength, 0);
}

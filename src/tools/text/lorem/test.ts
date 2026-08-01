import { strictEqual } from "node:assert";
import { loremParagraphs, loremSentences, loremWords, mulberry32 } from "./tool.ts";

const OPTS = { paragraphs: 1, sentencesPerParagraph: 0, seed: 42, style: "classic" } as const;

export async function runTest() {
  const a = mulberry32(42)();
  const b = mulberry32(42)();
  strictEqual(a, b, "same seed, same first draw");
  strictEqual(typeof a, "number");
  strictEqual(a >= 0 && a < 1, true, "prng output in [0,1)");

  const w = loremWords(5, OPTS);
  strictEqual(w.split(" ").length, 5, "five words");
  strictEqual(w.toLowerCase(), w, "words are lowercase");

  strictEqual(loremWords(5, OPTS), loremWords(5, OPTS), "seedable and deterministic");

  const sent = loremSentences(2, OPTS);
  strictEqual(sent.split(". ").length, 2, "two sentences");
  strictEqual(sent.endsWith("."), true);

  const para = loremParagraphs({ ...OPTS, paragraphs: 3, sentencesPerParagraph: 2 });
  strictEqual(para.split("\n\n").length, 3, "three paragraphs");
  strictEqual(para.split("\n\n")[0].split(". ").length, 2, "two sentences per paragraph");

  const techy = loremWords(10, { ...OPTS, style: "techy" });
  strictEqual(/[a-z]+/.test(techy), true);
}

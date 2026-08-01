import { deepStrictEqual, strictEqual } from "node:assert";
import { reverseWords, salad, scramble, scrambleWord, shuffle, sortLetters } from "./tool.ts";

export async function runTest() {
  deepStrictEqual(shuffle([1, 2, 3, 4], () => 0), [2, 3, 4, 1], "deterministic shuffle");

  const s = scrambleWord("hello", () => 0.5);
  strictEqual(s.length, 5);
  strictEqual(s[0], "h", "first letter kept");
  strictEqual(s[4], "o", "last letter kept");
  strictEqual([...s].sort().join(""), "ehllo", "letters are a permutation");

  strictEqual(scramble("a-b"), "a-b", "short words unchanged");
  strictEqual(scramble("cat", () => 0.5), "cat", "three-letter words unchanged");

  strictEqual(reverseWords("hello world. goodbye moon."), "world hello. moon goodbye.");
  strictEqual(reverseWords("a b\nc d").split("\n").length, 2, "newlines preserved");

  strictEqual(sortLetters("hello world"), "ehllo dlorw");
  strictEqual(sortLetters("hey!"), "ehy!", "punctuation preserved");

  strictEqual(salad("cba", "sort"), "abc", "salad dispatches");
  strictEqual(salad("same", "reverse"), "same");
}

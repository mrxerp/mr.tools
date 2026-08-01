import { deepStrictEqual, strictEqual } from "node:assert";
import { diffChars, diffLines, diffSummary, lcsDiff } from "./tool.ts";

export async function runTest() {
  deepStrictEqual(lcsDiff([], []), [], "empty diff");
  deepStrictEqual(lcsDiff(["a"], ["a"]), [{ type: "same", text: "a" }], "identical");

  deepStrictEqual(diffLines("a\nb", "a\nc"), [
    { type: "same", text: "a" },
    { type: "del", text: "b" },
    { type: "add", text: "c" },
  ], "line change");

  deepStrictEqual(diffChars("cat", "car"), [
    { type: "same", text: "c" },
    { type: "same", text: "a" },
    { type: "del", text: "t" },
    { type: "add", text: "r" },
  ], "char change");

  const sum = diffSummary("one\nsame", "two\nsame");
  strictEqual(sum.addedLines, 1);
  strictEqual(sum.removedLines, 1);
  strictEqual(sum.addedWords, 1);
  strictEqual(sum.removedWords, 1);

  deepStrictEqual(diffLines("same", "same"), [{ type: "same", text: "same" }], "no change");
}

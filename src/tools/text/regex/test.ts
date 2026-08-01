import { deepStrictEqual, strictEqual } from "node:assert";
import { replacePreview, runRegex } from "./tool.ts";

export async function runTest() {
  const r = runRegex("(\\w+)", "g", "a bb");
  strictEqual(r.ok, true);
  strictEqual(r.count, 2, "two matches");
  strictEqual(r.matches[0].index, 0);
  strictEqual(r.matches[0].text, "a");
  deepStrictEqual(r.matches[0].groups, ["a"]);
  strictEqual(r.matches[1].index, 2);
  strictEqual(r.matches[1].text, "bb");

  const bad = runRegex("(", "g", "x");
  strictEqual(bad.ok, false, "invalid pattern");
  strictEqual(bad.error.length > 0, true);

  const named = runRegex("(?<word>\\w+)", "g", "hi");
  deepStrictEqual(named.groupNames, ["word"]);

  const rep = replacePreview("a", "g", "banana", "o");
  strictEqual(rep.ok, true);
  strictEqual(rep.result, "bonono");
  strictEqual(rep.count, 3);

  const swap = replacePreview("(b)(a)", "g", "banana", "$2$1");
  strictEqual(swap.result, "abnana");

  const emptyMatch = runRegex("\\d*", "g", "ab");
  strictEqual(emptyMatch.ok, true, "empty matches do not hang");
}

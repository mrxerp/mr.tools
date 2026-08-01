import { strictEqual, deepStrictEqual } from "node:assert";
import { memeText, wrapLines, fitFontSize, textBlockHeight } from "./tool.ts";

export async function runTest() {
  strictEqual(memeText("  hello world "), "HELLO WORLD");
  strictEqual(memeText(""), "");

  deepStrictEqual(wrapLines("Hello world", 5), ["Hello", "world"]);
  deepStrictEqual(wrapLines("This is a test", 7), ["This is", "a test"]);
  deepStrictEqual(wrapLines("oneword", 3), ["one", "wor", "d"]);
  deepStrictEqual(wrapLines("   ", 5), []);

  strictEqual(fitFontSize(800, ["HELLO"], 200), 200, "requested size kept when it fits");
  strictEqual(fitFontSize(800, ["HELLO WORLD"], 200), 117, "long line shrinks to fit");
  strictEqual(fitFontSize(800, ["A"], 20), 20, "small requested size kept");
  strictEqual(fitFontSize(0, ["HELLO"], 100), 12, "zero width falls back to minimum");
  strictEqual(fitFontSize(800, [], 100), 100, "empty lines keep requested size");

  strictEqual(textBlockHeight(["A", "B"], 50, 0.1), 105, "two lines plus gap");
  strictEqual(textBlockHeight([], 50, 0.1), 0);
}

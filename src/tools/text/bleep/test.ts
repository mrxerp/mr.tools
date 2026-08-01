import { deepStrictEqual, strictEqual } from "node:assert";
import { bleepText, censorWord, detectBleeps } from "./tool.ts";

export async function runTest() {
  strictEqual(bleepText("what the hell is this crap"), "what the **** is this ****");
  strictEqual(bleepText("That was DAMN good."), "That was **** good.");
  strictEqual(bleepText("hello"), "hello", "clean text unchanged");
  strictEqual(bleepText("classic ass"), "classic ***", "word boundaries respected");

  strictEqual(
    bleepText("damn", { customWords: ["damn"], censor: (w) => "#".repeat(w.length) }),
    "####",
    "custom censor",
  );

  deepStrictEqual(detectBleeps("Fuck that crap"), ["fuck", "crap"]);
  deepStrictEqual(detectBleeps("all good"), [], "no bleeps");

  strictEqual(censorWord("hello"), "*****", "censor length matches");
}

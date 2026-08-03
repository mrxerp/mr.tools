import { strictEqual, ok, throws } from "node:assert";
import { generateTokens, resolveCharset, CHAR_SETS } from "./tool.ts";

export async function runTest() {
  const lowerDigits = generateTokens(24, { lower: true, digits: true }, 1)[0];
  ok(/^[a-z0-9]{24}$/.test(lowerDigits), "lower+digits token format");
  strictEqual(lowerDigits.length, 24, "token has requested length");

  const symbols = generateTokens(16, { symbols: true }, 1)[0];
  ok(/^[!@#$%^&*()\-_=+]+$/.test(symbols), "symbols-only token");
  strictEqual(symbols.length, 16, "symbols token length");

  const many = generateTokens(32, { lower: true, upper: true, digits: true }, 20);
  strictEqual(many.length, 20, "generates requested count");
  strictEqual(new Set(many).size, 20, "all 20 tokens unique");

  throws(() => generateTokens(0, { lower: true }, 1), /length/, "zero length throws");
  throws(() => generateTokens(10, {}, 1), /character set/, "no charset throws");
  throws(() => generateTokens(10, { lower: true }, 0), /count/, "zero count throws");

  strictEqual(resolveCharset({ lower: true }), CHAR_SETS.lower, "lower charset");
  strictEqual(resolveCharset({ upper: true, digits: true }).length, 36, "upper+digits length");
  strictEqual(resolveCharset({}), "", "empty charset resolves empty");
}

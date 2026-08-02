import { strictEqual } from "node:assert";
import { nameColor, nameColorAllStyles, generateColorName } from "./tool.ts";

export async function runTest() {
  const result = nameColor("#ff0000");
  strictEqual(result.hex, "#ff0000");
  strictEqual(typeof result.name, "string");
  strictEqual(result.name.length > 0, true);
  strictEqual(Array.isArray(result.hashtags), true);
  strictEqual(Array.isArray(result.facts), true);

  const allStyles = nameColorAllStyles("#00ff00");
  strictEqual(allStyles.length, 6);
  strictEqual(allStyles.every(s => typeof s.name === "string"), true);

  const generated = generateColorName("#0000ff", "candy");
  strictEqual(typeof generated, "string");
  strictEqual(generated.length > 0, true);
}

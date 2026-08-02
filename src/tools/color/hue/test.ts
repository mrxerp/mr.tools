import { strictEqual } from "node:assert";
import { parseColor, generateHarmonies } from "./tool.ts";

export async function runTest() {
  const color = parseColor("#ff0000");
  strictEqual(color.hex, "#ff0000");
  strictEqual(color.name, "Red");
  
  const harmonies = generateHarmonies(color, ["analogous", "complementary"]);
  strictEqual(harmonies.length >= 2, true);
}

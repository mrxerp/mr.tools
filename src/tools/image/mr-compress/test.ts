import { strictEqual } from "node:assert";
import { qualityForLevel, percentSaved } from "./tool.ts";

export async function runTest() {
  strictEqual(qualityForLevel("balanced"), 0.8);
  strictEqual(qualityForLevel("smaller"), 0.6);
  strictEqual(qualityForLevel("smallest"), 0.4);
  strictEqual(qualityForLevel("unknown"), 0.8, "unknown level falls back to balanced");

  strictEqual(percentSaved(1000, 500), 50);
  strictEqual(percentSaved(1000, 1000), 0);
  strictEqual(percentSaved(1000, 0), 100);
  strictEqual(percentSaved(500, 1000), -100, "bigger output gives negative percent");
  strictEqual(percentSaved(0, 100), 0, "zero before -> no percentage");
  strictEqual(percentSaved(1000, 750), 25);
  strictEqual(percentSaved(1000, 1), 100);
  strictEqual(percentSaved(1000, 2), 100, "rounds to whole percent");
  strictEqual(percentSaved(300, 200), 33);
}

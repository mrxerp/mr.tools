import { strictEqual } from "node:assert";
import { contrastRatio, checkContrast, suggestFixes, hexToRgb, rgbToHex } from "./tool.ts";

export async function runTest() {
  strictEqual(contrastRatio("#000000", "#ffffff"), 21);
  strictEqual(contrastRatio("#ffffff", "#000000"), 21);
  strictEqual(Math.round(contrastRatio("#1b1a17", "#fafaf8") * 100) / 100, 15.9);

  const check = checkContrast("#1b1a17", "#fafaf8");
  strictEqual(check.aaNormal, true);
  strictEqual(check.aaaNormal, true);
  strictEqual(check.level, "aaa");

  const failCheck = checkContrast("#777777", "#cccccc");
  strictEqual(failCheck.aaNormal, false);
  strictEqual(failCheck.level, "fail");

  const fixes = suggestFixes("#777777", "#ffffff");
  strictEqual(fixes.length, 4);
  strictEqual(fixes[0].meets.includes("AA Normal"), true);

  strictEqual(hexToRgb("#ff0000"), { r: 255, g: 0, b: 0 });
  strictEqual(hexToRgb("#f00"), { r: 255, g: 0, b: 0 });
  strictEqual(rgbToHex(255, 0, 0), "#ff0000");
  strictEqual(rgbToHex(300, -10, 128), "#ff0080");
}
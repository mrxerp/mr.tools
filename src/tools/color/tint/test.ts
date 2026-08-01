import { strictEqual } from "node:assert";
import {
  generateColorScale,
  generateScaleFromHue,
  generateCSSVariables,
  generateSCSSMap,
  generateTailwindConfig,
  getContrastRatios,
  findAccessiblePairs,
  type ColorScale,
} from "./tool.ts";

export async function runTest() {
  const scale = generateColorScale("#5a5bd9");
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  levels.forEach(level => {
    strictEqual(typeof scale[level], "string");
    strictEqual(scale[level].startsWith("#"), true);
    strictEqual(scale[level].length, 7);
  });

  const css = generateCSSVariables(scale, "test");
  strictEqual(css.includes("--test-500: #5a5bd9"), true);

  const scss = generateSCSSMap(scale, "test-scale");
  strictEqual(scss.includes("$test-scale:"), true);

  const tailwind = generateTailwindConfig(scale, "custom");
  strictEqual(tailwind.includes("theme"), true);

  const ratios = getContrastRatios(scale);
  strictEqual(typeof ratios[500].onWhite, "number");
  strictEqual(typeof ratios[500].onBlack, "number");

  const pairs = findAccessiblePairs(scale, 4.5);
  strictEqual(Array.isArray(pairs), true);

  const hueScale = generateScaleFromHue(220, 0.15);
  strictEqual(typeof hueScale[500], "string");
}
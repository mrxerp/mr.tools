import { strictEqual } from "node:assert";
import {
  generateColorPalette,
  generateCSSVariables,
  generateSCSSMap,
  generateTailwindConfig,
  shuffleColors,
  lockColors,
  randomColor,
  lightenColor,
  darkenColor,
  mixColors,
  type Color,
  type Palette,
} from "./tool.ts";

export async function runTest() {
  const palette = generateColorPalette("#5a5bd9", {
    analogous: true,
    complementary: true,
    triadic: true,
    tetradic: true,
    monochromatic: true,
  });

  strictEqual(palette.base.hex.toLowerCase(), "#5a5bd9");
  strictEqual(palette.harmonious.analogous.length, 5);
  strictEqual(palette.harmonious.complementary.length, 2);
  strictEqual(palette.harmonious.triadic.length, 3);
  strictEqual(palette.harmonious.tetradic.length, 4);
  strictEqual(palette.monochromatic.length, 5);

  const css = generateCSSVariables(palette);
  strictEqual(css.includes("--color-0: #5a5bd9"), true);

  const scss = generateSCSSMap(palette);
  strictEqual(scss.includes("$color-palette:"), true);

  const tailwind = generateTailwindConfig(palette);
  strictEqual(tailwind.includes("theme"), true);

  const shuffled = shuffleColors(palette.shuffled);
  strictEqual(shuffled.length, palette.shuffled.length);

  const locked = lockColors(palette.shuffled);
  strictEqual(locked.length, palette.shuffled.length);

  const rand = randomColor();
  strictEqual(rand.hex.startsWith("#"), true);
  strictEqual(rand.hex.length, 7);

  const light = lightenColor(palette.base, 20);
  strictEqual(light.hsl.l > palette.base.hsl.l, true);

  const dark = darkenColor(palette.base, 20);
  strictEqual(dark.hsl.l < palette.base.hsl.l, true);

  const mixed = mixColors(palette.base, palette.harmonious.complementary[0], 0.5);
  strictEqual(mixed.hex.startsWith("#"), true);
}
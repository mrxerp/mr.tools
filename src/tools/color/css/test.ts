import { strictEqual } from "node:assert";
import {
  extractFromImage,
  extractFromHexList,
  generateExports,
  generateSampleComponent,
  sortColorsByHue,
  sortColorsByLightness,
  colorToFormat,
} from "./tool.ts";

export async function runTest() {
  const mockImageData = {
    data: new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255,
      0, 255, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 0, 0, 255, 255,
    ]),
    width: 2,
    height: 2,
  } as ImageData;

  const fromImage = extractFromImage(mockImageData, 5);
  strictEqual(fromImage.length, 3);
  strictEqual(fromImage[0].hex, "#ff0000");

  const hexList = "#ff0000 #00ff00 #0000ff #ffff00 #ff00ff";
  const fromHex = extractFromHexList(hexList);
  strictEqual(fromHex.length, 5);
  strictEqual(fromHex[0].hex, "#ff0000");

  const exports = generateExports(fromHex, "test", false);
  strictEqual(exports.cssVariables.includes("--test-1: #ff0000"), true);
  strictEqual(exports.scssMap.includes("$test-palette:"), true);
  strictEqual(exports.tailwindConfig.includes("theme"), true);

  const withShades = generateExports(fromHex.slice(0, 1), "test", true);
  strictEqual(withShades.cssVariables.includes("--test-100:"), true);

  const htmlSample = generateSampleComponent(fromHex, "html");
  strictEqual(htmlSample.includes("palette-swatch"), true);
  strictEqual(htmlSample.includes("#ff0000"), true);

  const reactSample = generateSampleComponent(fromHex, "react");
  strictEqual(reactSample.includes("React"), true);

  const vueSample = generateSampleComponent(fromHex, "vue");
  strictEqual(vueSample.includes("template"), true);

  const sortedByHue = sortColorsByHue(fromHex);
  strictEqual(sortedByHue[0].hex, "#ff0000");

  const sortedByLightness = sortColorsByLightness(fromHex);
  // Both red and blue have lightness 50%, so order is stable (original order)
  strictEqual(sortedByLightness.length, 5);

  strictEqual(colorToFormat("#ff0000", "hex"), "#ff0000");
  strictEqual(colorToFormat("#ff0000", "rgb"), "rgb(255, 0, 0)");
  strictEqual(colorToFormat("#ff0000", "hsl").startsWith("hsl("), true);
  strictEqual(colorToFormat("#ff0000", "hwb").startsWith("hwb("), true);
}
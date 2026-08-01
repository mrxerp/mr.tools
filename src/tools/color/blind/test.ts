import { strictEqual } from "node:assert";
import {
  simulateCVD,
  simulatePaletteCVD,
  checkColorPairRisk,
  checkPaletteRisks,
  checkAllCVDTypes,
  findSafeColors,
  generateCVDReport,
  getCVDName,
  type CVDType,
} from "./tool.ts";

export async function runTest() {
  const red = "#ff0000";
  const green = "#00ff00";
  const blue = "#0000ff";

  const protoRed = simulateCVD(red, "protanopia");
  const deutRed = simulateCVD(red, "deuteranopia");
  const tritaRed = simulateCVD(red, "tritanopia");
  const achroRed = simulateCVD(red, "achromatopsia");

  strictEqual(protoRed.startsWith("#"), true);
  strictEqual(deutRed.startsWith("#"), true);
  strictEqual(tritaRed.startsWith("#"), true);
  strictEqual(achroRed.startsWith("#"), true);

  const palette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
  const simulated = simulatePaletteCVD(palette, "protanopia");
  strictEqual(simulated.length, 5);
  strictEqual(simulated[0].original, "#ff0000");

  const risk = checkColorPairRisk("#ff0000", "#00ff00", "protanopia");
  strictEqual(typeof risk.originalRatio, "number");
  strictEqual(typeof risk.simulatedRatio, "number");
  strictEqual(typeof risk.risky, "boolean");

  const allRisks = checkPaletteRisks(palette, "protanopia");
  strictEqual(allRisks.length, 10);

  const allTypes = checkAllCVDTypes(palette);
  strictEqual(Object.keys(allTypes).length, 4);

  const safe = findSafeColors("#ff0000", ["#ffffff", "#000000", "#00ff00"], "protanopia", 3);
  strictEqual(Array.isArray(safe), true);

  const report = generateCVDReport(palette);
  strictEqual(report.summary.length, 4);
  strictEqual(Object.keys(report.details).length, 4);

  strictEqual(getCVDName("protanopia"), "Protanopia (Red-blind)");
  strictEqual(getCVDName("deuteranopia"), "Deuteranopia (Green-blind)");
  strictEqual(getCVDName("tritanopia"), "Tritanopia (Blue-blind)");
  strictEqual(getCVDName("achromatopsia"), "Achromatopsia (Monochromacy)");
}
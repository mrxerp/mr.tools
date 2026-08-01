import { strictEqual } from "node:assert";
import {
  generateGradientCSS,
  addStop,
  removeStop,
  updateStop,
  createDefaultGradient,
  PRESETS,
  parseGradientCSS,
  type GradientConfig,
} from "./tool.ts";

export async function runTest() {
  const linear = createDefaultGradient("linear");
  strictEqual(linear.type, "linear");
  strictEqual(linear.stops.length, 2);
  strictEqual(generateGradientCSS(linear).startsWith("linear-gradient"), true);

  const radial = createDefaultGradient("radial");
  strictEqual(radial.type, "radial");
  strictEqual(generateGradientCSS(radial).startsWith("radial-gradient"), true);

  const conic = createDefaultGradient("conic");
  strictEqual(conic.type, "conic");
  strictEqual(generateGradientCSS(conic).startsWith("conic-gradient"), true);

  const withStop = addStop(linear, "#ff0000", 0.5);
  strictEqual(withStop.stops.length, 3);

  const withoutStop = removeStop(withStop, 1);
  strictEqual(withoutStop.stops.length, 2);

  const updated = updateStop(linear, 0, { color: "#00ff00" });
  strictEqual(updated.stops[0].color, "#00ff00");

  strictEqual(PRESETS.length, 10);
  strictEqual(PRESETS[0].name, "Sunset");

  const parsed = parseGradientCSS("linear-gradient(90deg, #ff0000 0%, #00ff00 100%)");
  strictEqual(parsed?.type, "linear");
  strictEqual(parsed?.angle, 90);
  strictEqual(parsed?.stops.length, 2);
}
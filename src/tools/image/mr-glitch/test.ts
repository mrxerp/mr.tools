import { deepStrictEqual, strictEqual } from "node:assert";
import { mulberry32, buildGlitchPlan, applyGlitch } from "./tool.ts";

export async function runTest() {
  const r1 = mulberry32(42);
  const r2 = mulberry32(42);
  deepStrictEqual(
    [r1(), r1(), r1()],
    [r2(), r2(), r2()],
    "same seed reproduces the same sequence",
  );
  const r3 = mulberry32(43);
  const seqA = [r1(), r1(), r1()];
  const seqB = [r3(), r3(), r3()];
  strictEqual(seqA.some((v, i) => v !== seqB[i]), true, "different seeds diverge");

  const planA = buildGlitchPlan(100, 50, 7, 0.8);
  const planB = buildGlitchPlan(100, 50, 7, 0.8);
  deepStrictEqual(planA, planB, "glitch plan is reproducible");
  for (const s of planA) {
    strictEqual(s.y >= 0 && s.y + s.h <= 50, true, `slice in bounds: ${JSON.stringify(s)}`);
    strictEqual(s.h >= 2, true, "slice has height");
  }
  strictEqual(buildGlitchPlan(100, 50, 7, 0).length, 3, "zero intensity yields 3 slices");

  const width = 5;
  const height = 1;
  const src = new Uint8ClampedArray(width * height * 4);
  for (let x = 0; x < width; x++) {
    src[x * 4] = (x + 1) * 10;
    src[x * 4 + 1] = 100;
    src[x * 4 + 2] = (x + 1) * 20;
    src[x * 4 + 3] = 255;
  }
  const displaced = applyGlitch(src, width, height, [{ y: 0, h: 1, dx: 2, shift: 0 }]);
  deepStrictEqual(
    Array.from(displaced).filter((_, i) => i % 4 === 0),
    [10, 20, 10, 20, 30],
    "band shifts red channel right by dx",
  );

  const split = applyGlitch(src, width, height, [{ y: 0, h: 1, dx: 0, shift: 1 }]);
  strictEqual(split[0 * 4 + 0], 20, "red shifts left: x=0 pulled from x=1");
  strictEqual(split[1 * 4 + 0], 30, "red at x=1 pulled from x=2");
  strictEqual(split[1 * 4 + 2], 20, "blue shifts right: x=1 pulled from x=0");
}

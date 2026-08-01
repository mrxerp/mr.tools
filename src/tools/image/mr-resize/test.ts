import { deepStrictEqual, strictEqual } from "node:assert";
import { computeTargetSize } from "./tool.ts";

export async function runTest() {
  strictEqual(computeTargetSize(800, 600, {}, false), null, "no dims -> null");
  strictEqual(computeTargetSize(800, 600, { width: 0, height: 0 }, false), null);
  strictEqual(computeTargetSize(800, 600, { width: null, height: null }, false), null);

  deepStrictEqual(computeTargetSize(800, 600, { width: 400, height: 300 }, false), {
    width: 400,
    height: 300,
  }, "exact size when both given and aspect unlocked");
  deepStrictEqual(computeTargetSize(800, 600, { width: 400, height: 300 }, true), {
    width: 400,
    height: 300,
  }, "same ratio requested with aspect locked");
  deepStrictEqual(computeTargetSize(800, 600, { width: 400, height: 200 }, true), {
    width: 267,
    height: 200,
  }, "contain fit with aspect locked");

  deepStrictEqual(computeTargetSize(800, 600, { width: 400 }, true), { width: 400, height: 300 });
  deepStrictEqual(computeTargetSize(800, 600, { width: 400 }, false), { width: 400, height: 300 });
  deepStrictEqual(computeTargetSize(800, 600, { height: 150 }, true), { width: 200, height: 150 });

  deepStrictEqual(computeTargetSize(100, 50, { width: 2000, height: 1000 }, true), {
    width: 2000,
    height: 1000,
  }, "oversized keep-aspect box upscales");
  deepStrictEqual(computeTargetSize(100, 50, { width: 100, height: 1000 }, false), {
    width: 100,
    height: 1000,
  }, "oversized exact is honoured");

  deepStrictEqual(computeTargetSize(801, 601, { width: 400 }, true), { width: 400, height: 300 });

  strictEqual(computeTargetSize(0, 100, { width: 100 }, true), null, "zero width -> null");
  strictEqual(computeTargetSize(-5, 100, { width: 100 }, true), null);
  deepStrictEqual(computeTargetSize(1, 1000, { height: 1 }, true), { width: 1, height: 1 });
}

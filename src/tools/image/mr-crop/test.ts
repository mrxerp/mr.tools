import { deepStrictEqual, strictEqual } from "node:assert";
import { clampCropRect, presetAspect } from "./tool.ts";

export async function runTest() {
  deepStrictEqual(clampCropRect({ x: 10, y: 10, w: 100, h: 50 }, { width: 500, height: 400 }), {
    x: 10,
    y: 10,
    w: 100,
    h: 50,
  }, "in-bounds rect untouched");

  deepStrictEqual(clampCropRect({ x: 400, y: 300, w: 200, h: 200 }, { width: 500, height: 400 }), {
    x: 300,
    y: 200,
    w: 200,
    h: 200,
  }, "rect exceeding bounds clamped back in");

  deepStrictEqual(clampCropRect({ x: 600, y: 500, w: 100, h: 100 }, { width: 500, height: 400 }), {
    x: 400,
    y: 300,
    w: 100,
    h: 100,
  }, "fully-outside rect pinned to edge");

  deepStrictEqual(clampCropRect({ x: 50, y: 50, w: -20, h: -10 }, { width: 500, height: 400 }), {
    x: 30,
    y: 40,
    w: 20,
    h: 10,
  }, "negative sizes flip and re-anchor");

  deepStrictEqual(clampCropRect({ x: -100, y: 0, w: 1000, h: 50 }, { width: 500, height: 400 }), {
    x: 0,
    y: 0,
    w: 500,
    h: 50,
  }, "wider than the image clamps to full width");

  deepStrictEqual(clampCropRect({ x: 0, y: 0, w: 0, h: 0 }, { width: 500, height: 400 }), {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  }, "zero size clamps to 1px");

  deepStrictEqual(clampCropRect({ x: 1.4, y: 2.6, w: 10.5, h: 7.2 }, { width: 500, height: 400 }), {
    x: 1,
    y: 3,
    w: 11,
    h: 7,
  }, "float coordinates round to pixels");

  deepStrictEqual(presetAspect("1:1"), { w: 1, h: 1 });
  deepStrictEqual(presetAspect("4:3"), { w: 4, h: 3 });
  deepStrictEqual(presetAspect("16:9"), { w: 16, h: 9 });
  strictEqual(presetAspect("free"), null, "free has no fixed aspect");
  strictEqual(presetAspect("bogus"), null);
  strictEqual(presetAspect(""), null);
}

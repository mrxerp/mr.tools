import { deepStrictEqual, strictEqual } from "node:assert";
import {
  clampGray,
  toGray,
  levelsFor,
  orderedDither,
  floydSteinberg,
} from "./tool.ts";

function assertAllInLevels(data: Float32Array, levels: number[]) {
  const set = new Set(levels);
  for (const v of data) {
    if (!set.has(v)) throw new Error(`value ${v} not in allowed levels ${JSON.stringify(levels)}`);
  }
}

export async function runTest() {
  strictEqual(clampGray(-5), 0);
  strictEqual(clampGray(300), 255);

  deepStrictEqual(levelsFor(1), [0, 255], "1-bit -> black and white");
  deepStrictEqual(levelsFor(2), [0, 85, 170, 255], "2-bit -> four levels");

  const rgba = new Uint8ClampedArray([
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
    255, 255, 255, 255,
  ]);
  const gray = toGray(rgba);
  strictEqual(gray.length, 4);
  strictEqual(Math.abs(gray[0] - 255 * 0.299) < 0.01, true, "red luma (float tolerance)");
  strictEqual(gray[3], 255, "white luma");

  const levels1 = levelsFor(1);
  const ordered = orderedDither(new Float32Array(16).fill(128), 4, 4, 1);
  assertAllInLevels(ordered, levels1);
  const whiteCount = Array.from(ordered).filter((v) => v === 255).length;
  strictEqual(whiteCount, 8, "uniform mid-gray ordered-dithers to exactly half white");

  const on = orderedDither(new Float32Array(16).fill(128), 4, 4, 1);
  const again = orderedDither(new Float32Array(16).fill(128), 4, 4, 1);
  deepStrictEqual(Array.from(on), Array.from(again), "deterministic");

  const fs = floydSteinberg(new Float32Array(16).fill(128), 4, 4, 1);
  assertAllInLevels(fs, levels1);
  const fsWhite = Array.from(fs).filter((v) => v === 255).length;
  const fsBlack = 16 - fsWhite;
  strictEqual(fsWhite > 0 && fsBlack > 0, true, "flat gray dithers to a mix of both levels");

  const fs2 = floydSteinberg(new Float32Array(16).fill(128), 4, 4, 2);
  assertAllInLevels(fs2, levelsFor(2));
}

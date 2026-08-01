import { deepStrictEqual, strictEqual } from "node:assert";
import {
  watermarkRect,
  scaledMarkSize,
  textWatermarkSize,
  tileOffsets,
} from "./tool.ts";

export async function runTest() {
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "tl", 5), { x: 5, y: 5 });
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "br", 5), { x: 75, y: 85 });
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "cc", 0), { x: 40, y: 45 });
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "tc", 0), { x: 40, y: 0 });
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "bc", 0), { x: 40, y: 90 });
  deepStrictEqual(watermarkRect(100, 100, 20, 10, "bl", 5), { x: 5, y: 85 });

  deepStrictEqual(
    watermarkRect(30, 30, 40, 10, "tl", 0),
    { x: 0, y: 0 },
    "mark wider than target clamps to 0",
  );

  deepStrictEqual(scaledMarkSize(2000, 1000, 100, 50, 0.1), { w: 200, h: 100 });
  const huge = scaledMarkSize(1000, 100, 100, 500, 1);
  strictEqual(huge.h, 90, "image watermark capped at 90% of target height");
  strictEqual(huge.w > 0, true, "width preserves aspect");
  deepStrictEqual(scaledMarkSize(100, 100, 0, 0, 0.5), { w: 0, h: 0 }, "empty mark");

  strictEqual(textWatermarkSize(1000, 500, 0.08), 40);
  strictEqual(textWatermarkSize(1000, 500, 0.01), 8, "minimum font size");
  strictEqual(textWatermarkSize(1000, 500, 0), 8);

  const tiles = tileOffsets(100, 100, 20, 10, 10);
  strictEqual(tiles.length, 20, "stepY is markH+gap=20, so 5x4 grid");
  deepStrictEqual(tiles[0], { x: 0, y: 0 });
  deepStrictEqual(tiles[1], { x: 30, y: 0 });
  deepStrictEqual(tiles[4], { x: 0, y: 20 });
  deepStrictEqual(tiles[5], { x: 30, y: 20 });
  deepStrictEqual(tiles[tiles.length - 1], { x: 90, y: 80 });
}

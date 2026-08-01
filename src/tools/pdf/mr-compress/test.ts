import { strictEqual } from "node:assert";
import { PDFDocument } from "pdf-lib";
import { compressPdf, reductionPct, isSmaller, shouldAttempt } from "./tool.ts";

export async function runTest() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawText("Hello captain", { x: 20, y: 100, size: 24 });
  page.drawRectangle({ x: 10, y: 10, width: 50, height: 30 });
  const bytes = await doc.save();

  const result = await compressPdf(bytes);
  const reloaded = await PDFDocument.load(result.data);
  strictEqual(reloaded.getPageCount(), 1, "output parses and page count preserved");
  strictEqual(result.resultBytes > 0, true, "output is non-empty");
  strictEqual(result.originalBytes, bytes.length, "original size recorded");

  strictEqual(reductionPct(100, 70), 30, "30% reduction");
  strictEqual(reductionPct(100, 120), -20, "negative = grew");
  strictEqual(reductionPct(0, 0), 0, "zero input guarded");
  strictEqual(isSmaller(result), result.resultBytes < result.originalBytes, "isSmaller consistent");
  strictEqual(shouldAttempt(bytes), true, "non-empty file attempted");
  strictEqual(shouldAttempt(new Uint8Array(0)), false, "empty file skipped");

  const pinned = await compressPdf(bytes, { useObjectStreams: false });
  strictEqual(await PDFDocument.load(pinned.data).then((d) => d.getPageCount()), 1, "single-variant output still parses");
}

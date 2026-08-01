import { strictEqual, rejects, deepStrictEqual } from "node:assert";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { perforate, cutCrops } from "./tool.ts";

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const portrait = doc.addPage([400, 300]);
  portrait.drawText("p0", { x: 20, y: 150, font, size: 20 });
  const rotated = doc.addPage([400, 300]);
  rotated.setRotation(degrees(90));
  rotated.drawText("p1", { x: 20, y: 150, font, size: 20 });
  return doc.save();
}

export async function runTest() {
  deepStrictEqual(cutCrops("vertical", 400, 300, 0), [
    { x: 0, y: 0, width: 200, height: 300 },
    { x: 200, y: 0, width: 200, height: 300 },
  ], "portrait vertical cut");
  deepStrictEqual(cutCrops("horizontal", 400, 300, 0), [
    { x: 0, y: 0, width: 400, height: 150 },
    { x: 0, y: 150, width: 400, height: 150 },
  ], "portrait horizontal cut");
  deepStrictEqual(cutCrops("vertical", 400, 300, 90), [
    { x: 0, y: 150, width: 400, height: 150 },
    { x: 0, y: 0, width: 400, height: 150 },
  ], "90° vertical cut slices along the long axis");
  deepStrictEqual(cutCrops("horizontal", 400, 300, 90), [
    { x: 0, y: 0, width: 200, height: 300 },
    { x: 200, y: 0, width: 200, height: 300 },
  ], "90° horizontal cut slices across the long axis");
  deepStrictEqual(cutCrops("vertical", 400, 300, 180), [
    { x: 200, y: 0, width: 200, height: 300 },
    { x: 0, y: 0, width: 200, height: 300 },
  ], "180° vertical cut is mirrored");
  deepStrictEqual(cutCrops("vertical", 400, 300, 270), [
    { x: 0, y: 0, width: 400, height: 150 },
    { x: 0, y: 150, width: 400, height: 150 },
  ], "270° vertical cut slices along the long axis");

  const bytes = await makePdf();
  const out = await perforate(bytes, "vertical");
  const doc = await PDFDocument.load(out);
  strictEqual(doc.getPageCount(), 4, "two pages per source page");

  const p0 = doc.getPage(0);
  strictEqual(p0.getRotation().angle, 0, "first half keeps rotation");
  deepStrictEqual(p0.getMediaBox(), { x: 0, y: 0, width: 200, height: 300 }, "first half is left");
  const p1 = doc.getPage(1);
  deepStrictEqual(p1.getMediaBox(), { x: 200, y: 0, width: 200, height: 300 }, "second half is right");

  const p2 = doc.getPage(2);
  strictEqual(p2.getRotation().angle, 90, "rotated source keeps rotation");
  deepStrictEqual(p2.getMediaBox(), { x: 0, y: 150, width: 400, height: 150 }, "90° page cuts along long axis");

  const hcut = await perforate(bytes, "horizontal");
  const hdoc = await PDFDocument.load(hcut);
  deepStrictEqual(hdoc.getPage(0).getMediaBox(), { x: 0, y: 0, width: 400, height: 150 }, "horizontal top half");
  deepStrictEqual(hdoc.getPage(1).getMediaBox(), { x: 0, y: 150, width: 400, height: 150 }, "horizontal bottom half");

  await rejects(perforate(new Uint8Array([1, 2, 3]), "vertical"), /parse|Failed/, "garbage input rejects");
}

import { strictEqual, rejects } from "node:assert";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mergePdfs } from "./tool.ts";

async function makePdf(label: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(label, { x: 20, y: 100, font, size: 14 });
  return doc.save();
}

export async function runTest() {
  const a = await makePdf("A");
  const b = await makePdf("B");

  const merged = await mergePdfs([a, b]);
  const doc = await PDFDocument.load(merged);
  strictEqual(doc.getPageCount(), 2, "merged doc has two pages");

  await rejects(mergePdfs([a]), /at least two/, "fewer than two PDFs rejects");

  const three = await mergePdfs([a, b, a]);
  strictEqual((await PDFDocument.load(three)).getPageCount(), 3, "merging three PDFs");
}

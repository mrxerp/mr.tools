import { strictEqual } from "node:assert";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractText, parseScale } from "./tool.ts";

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("hello captain", { x: 20, y: 100, font, size: 14 });
  const second = doc.addPage([200, 200]);
  second.drawText("second page", { x: 20, y: 100, font, size: 14 });
  return doc.save();
}

export async function runTest() {
  strictEqual(parseScale("2"), 2, "scale parses");
  strictEqual(parseScale("0.25"), 0.5, "scale clamps low");
  strictEqual(parseScale("99"), 4, "scale clamps high");
  strictEqual(parseScale("banana"), 2, "scale falls back");

  const bytes = await makePdf();
  const texts = await extractText(bytes);
  strictEqual(texts.length, 2, "one text block per page");
  strictEqual(texts[0].includes("hello"), true, "drawn text is extracted");
  strictEqual(texts[1].includes("second"), true, "second page text is extracted");

  console.log("    note: convertPdfToImages needs a browser (canvas) and is verified in the build only.");
}

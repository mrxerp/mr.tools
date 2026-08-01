import { strictEqual } from "node:assert";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { annotatePdf, hexToRgb, normalizeNotes } from "./tool.ts";

async function extractText(bytes: Uint8Array): Promise<string> {
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  try {
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    return content.items.map((i) => (i as { str?: string }).str ?? "").join(" ");
  } finally {
    doc.destroy();
  }
}

export async function runTest() {
  strictEqual(hexToRgb("#ff8000").r, 1);
  strictEqual(hexToRgb("#ff8000").g, 0x80 / 255);
  strictEqual(hexToRgb("#ff8000").b, 0);
  strictEqual(hexToRgb("ff8000").g, 0x80 / 255, "hex without # accepted");
  strictEqual(hexToRgb("garbage").r, 0, "invalid hex falls back to black");

  const norm = normalizeNotes(
    [
      { page: 1, x: 10, y: 20, text: "  hi  ", size: 8 },
      { page: 99, x: 0, y: 0, text: "clamped page" },
      { page: 1, x: 0, y: 0, text: "   " },
    ],
    1,
  );
  strictEqual(norm.length, 2, "empty notes dropped");
  strictEqual(norm[0].text, "hi");
  strictEqual(norm[0].size, 8);
  strictEqual(norm[0].color.g, 0, "default color black");
  strictEqual(norm[1].page, 1, "page clamped into document");
  strictEqual(norm[1].size, 12, "default size");

  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const bytes = await doc.save();
  const annotated = await annotatePdf(bytes, [{ page: 1, x: 20, y: 100, text: "hello" }]);
  const reloaded = await PDFDocument.load(annotated);
  strictEqual(reloaded.getPageCount(), 1, "output parses and page count preserved");
  strictEqual((await extractText(annotated)).includes("hello"), true, "note text present on page");
}

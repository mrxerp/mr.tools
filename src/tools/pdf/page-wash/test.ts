import { strictEqual, rejects, deepStrictEqual } from "node:assert";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { washPages, parsePageList, pdfPageCount } from "./tool.ts";

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of ["one", "two", "three"]) {
    const page = doc.addPage([200, 200]);
    page.drawText(label, { x: 20, y: 100, font, size: 14 });
  }
  return doc.save();
}

async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  await pdf.destroy();
  return texts;
}

export async function runTest() {
  deepStrictEqual(parsePageList("3,5-7", 9), [3, 5, 6, 7], "range spec parses");
  deepStrictEqual(parsePageList("2", 3), [2], "single page parses");
  deepStrictEqual(parsePageList("7-2, 3, 3", 9), [2, 3, 4, 5, 6, 7], "reversed range covers all pages");
  await rejects(async () => parsePageList("", 3), /at least one/, "empty spec rejects");
  await rejects(async () => parsePageList("x", 3), /Invalid page/, "garbage rejects");
  await rejects(async () => parsePageList("0", 3), /start at 1/, "zero rejects");
  await rejects(async () => parsePageList("4", 3), /past the last page/, "out of range rejects");

  const bytes = await makePdf();
  strictEqual(await pdfPageCount(bytes), 3, "page count helper");

  const washed = await washPages(bytes, [2]);
  const doc = await PDFDocument.load(washed);
  strictEqual(doc.getPageCount(), 3, "page count is preserved");

  const texts = await pageTexts(washed);
  strictEqual(texts[0].includes("one"), true, "page 1 keeps its text");
  strictEqual(texts[1].trim().length, 0, "page 2 is blank");
  strictEqual(texts[2].includes("three"), true, "page 3 keeps its text");

  const washed2 = await washPages(bytes, [1, 3]);
  const texts2 = await pageTexts(washed2);
  strictEqual(texts2[0].trim().length, 0, "leading page blanks");
  strictEqual(texts2[2].trim().length, 0, "trailing page blanks");

  await rejects(washPages(bytes, []), /No valid pages/, "empty target list rejects");
  await rejects(washPages(bytes, [99]), /No valid pages/, "out of range target list rejects");
}

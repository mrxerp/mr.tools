import { strictEqual, throws } from "node:assert";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { splitPdf, parseRanges, mergeRanges } from "./tool.ts";

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`page ${i}`, { x: 20, y: 100, font, size: 14 });
  }
  return doc.save();
}

function countPages(chunks: { bytes: Uint8Array }[]): Promise<number[]> {
  return Promise.all(chunks.map(async (c) => (await PDFDocument.load(c.bytes)).getPageCount()));
}

export async function runTest() {
  const pdf = await makePdf(4);

  const every = await splitPdf(pdf, { type: "every-page" });
  strictEqual(every.length, 4, "four chunks from a four-page PDF");
  strictEqual(JSON.stringify(await countPages(every)), "[1,1,1,1]", "each chunk is one page");
  strictEqual(every[0].name, "page-1.pdf", "chunk naming");

  const ranges = await splitPdf(pdf, { type: "ranges", spec: "1-2,4" });
  strictEqual(JSON.stringify(await countPages(ranges)), "[2,1]", "ranges 1-2 and 4 give 2 and 1 pages");
  strictEqual(ranges[0].name, "pages-1-2.pdf", "multi-page range naming");

  const n = await splitPdf(pdf, { type: "every-n", n: 3 });
  strictEqual(JSON.stringify(await countPages(n)), "[3,1]", "groups of 3 then remainder");

  strictEqual(JSON.stringify(parseRanges("1-3,5,7-9", 9)), "[[1,3],[5,5],[7,9]]", "range parsing");
  strictEqual(JSON.stringify(parseRanges("9-7,2", 9)), "[[7,9],[2,2]]", "reversed range normalizes");
  strictEqual(JSON.stringify(parseRanges("1-30", 4)), "[[1,4]]", "range clamps to last page");
  strictEqual(JSON.stringify(mergeRanges([[1,3],[2,5],[8,9]])), "[[1,5],[8,9]]", "overlapping ranges merge");
  throws(() => parseRanges("banana", 4), /Invalid range/, "garbage rejects");
  throws(() => parseRanges("5", 4), /past the last page/, "out-of-range rejects");
  throws(() => parseRanges("", 4), /at least one/, "empty rejects");
}

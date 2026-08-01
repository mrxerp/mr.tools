import { PDFDocument } from "pdf-lib";

export type PdfBytes = ArrayBuffer | Uint8Array;

export async function pdfPageCount(bytes: PdfBytes): Promise<number> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPageCount();
}

export function parsePageList(spec: string, maxPage: number): number[] {
  const trimmed = spec.trim();
  if (!trimmed) throw new Error("Enter at least one page, e.g. 3 or 5-7.");
  const pages = new Set<number>();
  for (const raw of trimmed.split(",")) {
    const part = raw.trim();
    const match = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    let a: number;
    let b: number;
    if (match) {
      a = Number(match[1]);
      b = Number(match[2]);
    } else if (/^\d+$/.test(part)) {
      a = Number(part);
      b = a;
    } else {
      throw new Error(`Invalid page "${part}". Use numbers like 3 or 5-7.`);
    }
    if (a < 1 || b < 1) throw new Error(`Page numbers start at 1 (got "${part}").`);
    if (a > b) [a, b] = [b, a];
    if (a > maxPage) throw new Error(`Page "${part}" is past the last page (${maxPage}).`);
    for (let p = a; p <= Math.min(b, maxPage); p++) pages.add(p);
  }
  return [...pages].sort((x, y) => x - y);
}

export async function washPages(bytes: PdfBytes, pages: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const total = doc.getPageCount();
  if (total === 0) throw new Error("This PDF has no pages.");
  const targets = [...new Set(pages)]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= total)
    .sort((a, b) => b - a);
  if (targets.length === 0)
    throw new Error(`No valid pages to wash — this PDF has ${total} page${total === 1 ? "" : "s"}.`);
  for (const pageNum of targets) {
    const index = pageNum - 1;
    const { width, height } = doc.getPage(index).getSize();
    doc.removePage(index);
    doc.insertPage(index, [width, height]);
  }
  return doc.save();
}

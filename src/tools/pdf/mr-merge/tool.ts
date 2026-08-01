import { PDFDocument } from "pdf-lib";

export type PdfBytes = ArrayBuffer | Uint8Array;

export async function mergePdfs(files: PdfBytes[]): Promise<Uint8Array> {
  if (files.length < 2) throw new Error("Need at least two PDFs to merge.");
  const merged = await PDFDocument.create();
  for (const bytes of files) {
    const source = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return merged.save();
}

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfBytes = ArrayBuffer | Uint8Array;

export type ConvertMode = "images" | "text";

export interface ConvertResult {
  mode: ConvertMode;
  blobs: Blob[];
  texts: string[];
}

/** Clamps a scale selector value to a sane rendering range; falls back on garbage. */
export function parseScale(value: string, fallback = 2): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(4, Math.max(0.5, n));
}

export async function extractText(bytes: PdfBytes): Promise<string[]> {
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

export async function convertPdfToImages(bytes: PdfBytes, scale: number): Promise<Blob[]> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    blobs.push(
      await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode page as PNG."))),
          "image/png",
        ),
      ),
    );
  }
  await pdf.destroy();
  return blobs;
}

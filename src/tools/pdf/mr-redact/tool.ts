import { PDFDocument, rgb } from "pdf-lib";

export interface RedactionRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageSize {
  page: number;
  width: number;
  height: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export function normalizeRects(rects: RedactionRect[], pageSizes: PageSize[]): RedactionRect[] {
  const out: RedactionRect[] = [];
  for (const rect of rects) {
    const size = pageSizes.find((s) => s.page === rect.page);
    if (!size) continue;
    if (
      !isFinite(rect.x) ||
      !isFinite(rect.y) ||
      !isFinite(rect.width) ||
      !isFinite(rect.height)
    ) {
      continue;
    }
    const x = clamp(rect.x, 0, size.width);
    const y = clamp(rect.y, 0, size.height);
    const width = clamp(rect.width, 0, size.width - x);
    const height = clamp(rect.height, 0, size.height - y);
    if (width <= 0 || height <= 0) continue;
    out.push({ page: rect.page, x, y, width, height });
  }
  return out;
}

export function normalizeColor(color: RGBColor | undefined): RGBColor {
  return {
    r: clamp(color?.r ?? 0, 0, 1),
    g: clamp(color?.g ?? 0, 0, 1),
    b: clamp(color?.b ?? 0, 0, 1),
  };
}

export async function redactPdf(
  bytes: ArrayBuffer | Uint8Array,
  rects: RedactionRect[],
  color: RGBColor = { r: 0, g: 0, b: 0 },
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const pageSizes: PageSize[] = pages.map((p, i) => {
    const s = p.getSize();
    return { page: i + 1, width: s.width, height: s.height };
  });
  const ink = normalizeColor(color);
  for (const rect of normalizeRects(rects, pageSizes)) {
    pages[rect.page - 1].drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rgb(ink.r, ink.g, ink.b),
    });
  }
  return pdf.save();
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

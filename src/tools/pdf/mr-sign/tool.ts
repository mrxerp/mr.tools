import { PDFDocument } from "pdf-lib";

export interface SignOptions {
  page?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SignaturePlacement {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function resolvePlacement(
  options: SignOptions,
  pageWidth: number,
  pageHeight: number,
  aspectRatio: number,
): SignaturePlacement {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const width =
    options.width === undefined
      ? Math.min(180, pageWidth * 0.4)
      : clamp(options.width, 1, pageWidth);
  const height =
    options.height === undefined
      ? Math.min(width / (aspectRatio > 0 ? aspectRatio : 1), pageHeight)
      : clamp(options.height, 1, pageHeight);
  const x = options.x === undefined ? (pageWidth - width) / 2 : clamp(options.x, 0, pageWidth - width);
  const y = options.y === undefined ? 40 : clamp(options.y, 0, pageHeight - height);
  return { page, x, y, width, height };
}

export async function signPdf(
  bytes: ArrayBuffer | Uint8Array,
  signaturePngDataUrl: string,
  options: SignOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const image = await pdf.embedPng(dataUrlToBytes(signaturePngDataUrl));
  const pages = pdf.getPages();
  const pageIndex = clamp((options.page ?? pages.length) - 1, 0, pages.length - 1);
  const page = pages[pageIndex];
  const { width, height } = page.getSize();
  const p = resolvePlacement(options, width, height, image.width / image.height);
  page.drawImage(image, { x: p.x, y: p.y, width: p.width, height: p.height });
  return pdf.save();
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

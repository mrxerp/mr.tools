import { PDFDocument } from "pdf-lib";

export interface CompressOptions {
  useObjectStreams?: boolean;
}

export interface CompressResult {
  data: Uint8Array;
  originalBytes: number;
  resultBytes: number;
}

export function reductionPct(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0) return 0;
  return ((originalBytes - resultBytes) / originalBytes) * 100;
}

export function isSmaller(result: CompressResult): boolean {
  return result.resultBytes < result.originalBytes;
}

export function shouldAttempt(bytes: ArrayBuffer | Uint8Array): boolean {
  return toUint8(bytes).byteLength > 0;
}

export async function compressPdf(
  bytes: ArrayBuffer | Uint8Array,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const variants: boolean[] =
    options.useObjectStreams === undefined ? [true, false] : [options.useObjectStreams];
  const candidates = await Promise.all(
    variants.map((useObjectStreams) => pdf.save({ useObjectStreams })),
  );
  candidates.sort((a, b) => a.length - b.length);
  const originalBytes = toUint8(bytes).byteLength;
  return { data: candidates[0], originalBytes, resultBytes: candidates[0].length };
}

function toUint8(bytes: ArrayBuffer | Uint8Array): Uint8Array {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

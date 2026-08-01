import { PDFDocument } from "pdf-lib";

export type PdfBytes = ArrayBuffer | Uint8Array;

export type SplitMode =
  | { type: "every-page" }
  | { type: "every-n"; n: number }
  | { type: "ranges"; spec: string };

export interface Chunk {
  name: string;
  bytes: Uint8Array;
}

/** Parses "1-3,5,7-9" into inclusive ranges, clamping to maxPage. Throws on invalid input. */
export function parseRanges(input: string, maxPage: number): [number, number][] {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter at least one page range, e.g. 1-3,5,7-9.");
  const out: [number, number][] = [];
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
      throw new Error(`Invalid range "${part}". Use numbers like 1-3 or 5.`);
    }
    if (a < 1 || b < 1) throw new Error(`Page numbers start at 1 (got "${part}").`);
    if (a > b) [a, b] = [b, a];
    if (a > maxPage) throw new Error(`Range "${part}" starts past the last page (${maxPage}).`);
    b = Math.min(b, maxPage);
    out.push([a, b]);
  }
  return out;
}

/** Merges overlapping or adjacent ranges into disjoint chunks. */
export function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function chunkName(a: number, b: number): string {
  return a === b ? `page-${a}.pdf` : `pages-${a}-${b}.pdf`;
}

export async function splitPdf(bytes: PdfBytes, mode: SplitMode): Promise<Chunk[]> {
  const source = await PDFDocument.load(bytes);
  const total = source.getPageCount();
  if (total === 0) throw new Error("This PDF has no pages.");

  let ranges: [number, number][];
  if (mode.type === "every-page") {
    ranges = Array.from({ length: total }, (_, i) => [i + 1, i + 1]);
  } else if (mode.type === "every-n") {
    const n = mode.n;
    if (!Number.isInteger(n) || n < 1) throw new Error("Group size must be a whole number of 1 or more.");
    ranges = [];
    for (let start = 1; start <= total; start += n) ranges.push([start, Math.min(start + n - 1, total)]);
  } else {
    ranges = mergeRanges(parseRanges(mode.spec, total));
  }

  const chunks: Chunk[] = [];
  for (const [a, b] of ranges) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(source, Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
    for (const page of pages) out.addPage(page);
    chunks.push({ name: chunkName(a, b), bytes: await out.save() });
  }
  return chunks;
}

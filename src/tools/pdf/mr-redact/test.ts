import { strictEqual } from "node:assert";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { redactPdf, normalizeRects, normalizeColor } from "./tool.ts";

async function pageOpNames(bytes: Uint8Array): Promise<string[]> {
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  try {
    const page = await doc.getPage(1);
    const ol = await page.getOperatorList();
    const inv: Record<number, string> = {};
    for (const [k, v] of Object.entries(pdfjsLib.OPS)) inv[v as number] = k;
    return ol.fnArray.map((fn) => inv[fn] ?? String(fn));
  } finally {
    doc.destroy();
  }
}

export async function runTest() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  page.drawText("secret", { x: 20, y: 100, size: 24 });
  const before = await doc.save();

  const beforeOps = await pageOpNames(new Uint8Array(before));
  strictEqual(beforeOps.includes("constructPath"), false, "no rectangle path before redaction");
  strictEqual(beforeOps.includes("fill"), false, "no fill before redaction");

  const redacted = await redactPdf(before, [{ page: 1, x: 15, y: 90, width: 90, height: 30 }]);
  const reloaded = await PDFDocument.load(redacted);
  strictEqual(reloaded.getPageCount(), 1, "output parses and page count preserved");
  const ops = await pageOpNames(redacted);
  strictEqual(ops.includes("constructPath"), true, "rectangle path drawn on the page");
  strictEqual(ops.includes("fill"), true, "rectangle filled");

  const sizes = [{ page: 1, width: 200, height: 200 }];
  const norm = normalizeRects([{ page: 1, x: -10, y: -10, width: 500, height: 500 }], sizes);
  strictEqual(norm.length, 1, "out-of-bounds rect kept after clamping");
  strictEqual(norm[0].x, 0);
  strictEqual(norm[0].y, 0);
  strictEqual(norm[0].width, 200);
  strictEqual(norm[0].height, 200);
  strictEqual(normalizeRects([{ page: 2, x: 0, y: 0, width: 10, height: 10 }], sizes).length, 0, "unknown page dropped");
  strictEqual(normalizeRects([{ page: 1, x: 0, y: 0, width: 0, height: 10 }], sizes).length, 0, "zero-width rect dropped");
  const c = normalizeColor({ r: 2, g: -1, b: 0.5 });
  strictEqual(c.r, 1);
  strictEqual(c.g, 0);
  strictEqual(c.b, 0.5);
  strictEqual(normalizeColor(undefined).g, 0, "missing color defaults to black");
}

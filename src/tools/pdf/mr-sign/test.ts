import { strictEqual } from "node:assert";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { signPdf, dataUrlToBytes, resolvePlacement } from "./tool.ts";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

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
  const raw = dataUrlToBytes(PNG_DATA_URL);
  strictEqual(raw.length > 0, true, "data URL decodes to PNG bytes");

  const p = resolvePlacement({}, 200, 200, 2);
  strictEqual(p.page, 1, "default page is 1");
  strictEqual(p.width, 80, "default width 40% of page, capped at 180");
  strictEqual(p.height, 40, "height follows aspect ratio");
  const clamped = resolvePlacement({ page: 5, x: 1000, y: -5, width: 50 }, 200, 200, 1);
  strictEqual(clamped.page, 5, "explicit page kept");
  strictEqual(clamped.x, 150, "x clamped into page");
  strictEqual(clamped.y, 0, "negative y clamped to 0");
  strictEqual(clamped.width, 50);
  strictEqual(resolvePlacement({ width: 1000 }, 200, 200, 1).width, 200, "width clamped into page");

  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const signed = await signPdf(await doc.save(), PNG_DATA_URL, { page: 1, x: 10, y: 10, width: 40, height: 40 });
  const reloaded = await PDFDocument.load(signed);
  strictEqual(reloaded.getPageCount(), 1, "output parses and page count preserved");
  const ops = await pageOpNames(signed);
  strictEqual(ops.includes("paintImageXObject"), true, "an image is drawn on the page");
}

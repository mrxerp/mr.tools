import { strictEqual, rejects } from "node:assert";
import { deflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { imagesToPdf, detectImageType } from "./tool.ts";

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function tinyPng(width: number, height: number, rgba: [number, number, number, number]): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const off = y * (1 + width * 4) + 1 + x * 4;
      raw[off] = rgba[0];
      raw[off + 1] = rgba[1];
      raw[off + 2] = rgba[2];
      raw[off + 3] = rgba[3];
    }
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const JPG_1X1 = Buffer.from([
  0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07,
  0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f,
  0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
  0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d,
  0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01,
  0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x48, 0x7f, 0xff, 0xd9,
]);

export async function runTest() {
  const png = tinyPng(3, 2, [255, 0, 0, 255]);
  strictEqual(detectImageType(png), "png", "PNG magic bytes detected");
  strictEqual(detectImageType(JPG_1X1), "jpg", "JPEG magic bytes detected");
  strictEqual(detectImageType(new Uint8Array([1, 2, 3, 4])), null, "unknown bytes rejected");

  const pdf = await imagesToPdf([
    { bytes: new Uint8Array(png), mime: "image/png" },
    { bytes: new Uint8Array(JPG_1X1), mime: "image/jpeg" },
  ]);
  const doc = await PDFDocument.load(pdf);
  strictEqual(doc.getPageCount(), 2, "one page per image");
  strictEqual(doc.getPage(0).getWidth(), 3, "page matches PNG width");
  strictEqual(doc.getPage(0).getHeight(), 2, "page matches PNG height");
  strictEqual(doc.getPage(1).getWidth(), 1, "page matches JPEG width");

  const combined = await imagesToPdf(
    [
      { bytes: new Uint8Array(png), mime: "image/png" },
      { bytes: new Uint8Array(png), mime: "image/png" },
    ],
    "combined",
  );
  const cdoc = await PDFDocument.load(combined);
  strictEqual(cdoc.getPageCount(), 1, "combined mode makes one page");
  strictEqual(cdoc.getPage(0).getHeight(), 4, "stacked images add height");

  await rejects(imagesToPdf([]), /at least one/, "empty input rejects");
  await rejects(
    imagesToPdf([{ bytes: new Uint8Array([9, 9, 9]), mime: "image/bmp" }]),
    /Unsupported image type/,
    "unsupported format rejects",
  );
}

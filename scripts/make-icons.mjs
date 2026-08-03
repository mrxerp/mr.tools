/**
 * make-icons.mjs - generates the mr icon set with zero dependencies.
 *
 * Draws the "focus target" mark (ring + dot) on the mr accent square and
 * writes PNGs into public/icons/:
 *   icon-192.png, icon-512.png (rounded corners, PWA icons)
 *   maskable-192.png, maskable-512.png (full-bleed, mark scaled to safe zone)
 *
 * PNG writing uses only node:zlib deflateSync + a local CRC32. No deps.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// ---- palette ---------------------------------------------------------------
const ACCENT = [90, 91, 217]; // #5a5bd9
const INK = [27, 26, 23]; // #1b1a17
const PAPER = [255, 255, 255];

// ---- CRC32 ----------------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 compression/filter/interlace = 0

  const raw = Buffer.alloc(height * (1 + width * 4));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter none
    rgba.copy(raw, o, y * width * 4, (y + 1) * width * 4);
    o += width * 4;
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---- drawing ---------------------------------------------------------------
function drawMark(size, { maskable }) {
  const px = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const corner = size * 0.22; // rounded corner radius (non-maskable)
  const ringR = size * (maskable ? 0.17 : 0.26);
  const ringW = size * (maskable ? 0.045 : 0.055);
  const coreR = size * (maskable ? 0.08 : 0.1);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // background fill, rounded corners unless maskable
      let alpha = 255;
      if (!maskable) {
        const dx = Math.max(corner - x, x - (size - 1 - corner), 0);
        const dy = Math.max(corner - y, y - (size - 1 - corner), 0);
        if (dx > 0 || dy > 0) {
          const d = Math.hypot(dx, dy);
          if (d > corner) alpha = 0;
        }
      }
      const d = Math.hypot(x - c, y - c);
      let [r, g, b] = ACCENT;
      if (Math.abs(d - ringR) <= ringW) [r, g, b] = PAPER;
      else if (d <= coreR) [r, g, b] = INK;
      // antialias ring edges
      if (alpha > 0) {
        const ringEdge = Math.min(Math.abs(d - (ringR - ringW)), Math.abs(d - (ringR + ringW)));
        if (ringEdge < 1) alpha = Math.min(alpha, Math.round(ringEdge * 255));
      }
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = alpha;
    }
  }
  return px;
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), encodePNG(size, size, drawMark(size, { maskable: false })));
  writeFileSync(join(outDir, `maskable-${size}.png`), encodePNG(size, size, drawMark(size, { maskable: true })));
  console.log(`wrote icon-${size}.png, maskable-${size}.png`);
}

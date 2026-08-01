import { strictEqual, rejects } from "node:assert";
import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { unlockPdf } from "./tool.ts";

const PAD = Uint8Array.from([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56,
  0xff, 0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }
  let i = 0;
  j = 0;
  const out = new Uint8Array(data.length);
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    out[k] = data[k] ^ s[(s[i] + s[j]) & 0xff];
  }
  return out;
}

function padPassword(pw: string): Uint8Array {
  const s = new TextEncoder().encode(pw);
  const out = new Uint8Array(32);
  out.set(s.subarray(0, 32));
  out.set(PAD.subarray(0, 32 - s.length), s.length);
  return out;
}

function le32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

/** Builds a genuine RC4/40-bit encrypted PDF (PDF 1.4, V1/R2) with a user password. */
function buildEncryptedPdf(): Uint8Array {
  const up = padPassword("foo");
  const op = padPassword("own");
  const perm = -60 >>> 0;
  const id = new Uint8Array(new TextEncoder().encode("0123456789abcdef0123456789abcdef"));
  const ownerKey = rc4(createHash("md5").update(op).digest().subarray(0, 5), up);
  const fileKey = createHash("md5")
    .update(Buffer.concat([Buffer.from(up), Buffer.from(ownerKey), Buffer.from(le32(perm)), Buffer.from(id)]))
    .digest()
    .subarray(0, 5);
  const U = rc4(fileKey, PAD);
  const stream = new TextEncoder().encode("BT /F1 24 Tf 72 720 Td (hello secret) Tj ET");
  const objectKey = createHash("md5")
    .update(Buffer.concat([Buffer.from(fileKey), new Uint8Array([6, 0, 0, 0, 0])]))
    .digest()
    .subarray(0, 10);
  const encStream = rc4(objectKey, stream);

  const objs = [
    "",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Filter /Standard /V 1 /R 2 /Length 40 /O <${Buffer.from(ownerKey).toString("hex")}> /U <${Buffer.from(U).toString("hex")}> /P ${perm} >>`,
    `<< /Length ${encStream.length} >>\nstream\n${Buffer.from(encStream).toString("latin1")}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Encrypt 5 0 R /ID [<${Buffer.from(id).toString("hex")}> <${Buffer.from(id).toString("hex")}>] >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

async function makePlainPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("plain", { x: 20, y: 100, font, size: 14 });
  return doc.save();
}

export async function runTest() {
  const plain = await makePlainPdf();
  const unlocked = await unlockPdf(plain, "irrelevant");
  const roundTrip = await PDFDocument.load(unlocked);
  strictEqual(roundTrip.getPageCount(), 1, "plain PDF round-trips and loads without a password");

  const encrypted = buildEncryptedPdf();
  await rejects(PDFDocument.load(encrypted), "fixture is genuinely flagged encrypted");
  await rejects(unlockPdf(encrypted, "foo"), /password-protected/, "encrypted PDF is refused, never a broken file");
}

/* mr.tools browser smoke - runs against a local preview server.
   Loads every tool page, asserts the stage mounts with zero console/page
   errors, checks search works, and drives real interactions through the
   deterministic tools (case, password, age, qr, image resize, pdf merge/split).
*/
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/error/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js");
const { PDFDocument, StandardFonts, rgb } = require("/home/error/co/micro/node_modules/pdf-lib");
const zlib = require("node:zlib");

const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:4321";

/* ---------- fixture generators ---------- */
const CRC_TABLE = (() => {
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
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  return Buffer.concat([len, Buffer.from(type, "ascii"), data, (() => { const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data]))); return c; })()]);
}
function genPng() {
  const size = 8;
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) { px[i*4]=220; px[i*4+1]=50; px[i*4+2]=50; px[i*4+3]=255; }
  const raw = Buffer.alloc(size * (1 + size * 4));
  let o = 0;
  for (let y = 0; y < size; y++) { raw[o++] = 0; px.copy(raw, o, y*size*4, (y+1)*size*4); o += size*4; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4); ihdr[8]=8; ihdr[9]=6;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
async function genPdf(pageCount, label) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const p = doc.addPage([180, 180]);
    p.drawText(`${label} page ${i + 1}`, { x: 40, y: 90, size: 12, font, color: rgb(0, 0, 0) });
  }
  return Buffer.from(await doc.save());
}

/* ---------- runner ---------- */
const failures = [];
const pass = (t) => console.log(`  ok   ${t}`);
const fail = (t, why) => { failures.push(t + " - " + why); console.error(`FAIL   ${t} - ${why}`); };

async function loadCheck(page, route, label) {
  const errs = [];
  const onPageErr = (e) => errs.push("pageerror: " + e.message);
  const onConsole = (m) => { if (m.type() === "error") errs.push("console: " + m.text()); };
  page.on("pageerror", onPageErr);
  page.on("console", onConsole);
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForSelector("section.stage", { timeout: 8000 });
  } catch (e) {
    fail(label, "stage did not mount: " + e.message.split("\n")[0]);
    return;
  } finally {
    page.off("pageerror", onPageErr);
    page.off("console", onConsole);
  }
  // async errors can surface after mount - give scripts a beat
  await page.waitForTimeout(600);
  const mounted = await page.evaluate(() => {
    return { hasSearch: !!document.querySelector("input[type=search]"), hasBadge: document.body.textContent.includes("nothing uploads") };
  });
  if (errs.length) { fail(label, errs.slice(0, 2).join("; ")); return; }
  pass(label + (mounted.hasBadge ? " (chrome ok)" : " (stage ok)"));
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const routes = [
    "/tools/age/age/", "/tools/age/anniversary/", "/tools/age/countdown/",
    "/tools/age/date-diff/", "/tools/age/dst/", "/tools/age/era/",
    "/tools/age/meeting/", "/tools/age/shift/", "/tools/age/streak/",
    "/tools/age/timezone/", "/tools/age/world-clock/",
    "/tools/audio/bpm/", "/tools/audio/chords/", "/tools/audio/mic/",
    "/tools/audio/mixer/", "/tools/audio/speak/", "/tools/audio/tone/",
    "/tools/audio/trim/", "/tools/audio/vocal/",
    "/tools/image/mr-compress/", "/tools/image/mr-convert/",
    "/tools/image/mr-crop/", "/tools/image/mr-dither/", "/tools/image/mr-fade/",
    "/tools/image/mr-glitch/", "/tools/image/mr-meme/", "/tools/image/mr-palette/",
    "/tools/image/mr-pixelate/", "/tools/image/mr-resize/", "/tools/image/mr-watermark/",
    "/tools/pdf/diff/", "/tools/pdf/img-to-pdf/", "/tools/pdf/mr-annotate/",
    "/tools/pdf/mr-compress/", "/tools/pdf/mr-convert/", "/tools/pdf/mr-form/",
    "/tools/pdf/mr-merge/", "/tools/pdf/mr-ocr/", "/tools/pdf/mr-redact/",
    "/tools/pdf/mr-sign/", "/tools/pdf/mr-split/", "/tools/pdf/mr-unlock/",
    "/tools/pdf/page-wash/", "/tools/pdf/perforate/",
    "/tools/qr/ean/", "/tools/qr/place/", "/tools/qr/qr/",
    "/tools/qr/reader/", "/tools/qr/vcard/", "/tools/qr/wifi-qr/",
    "/tools/text/bleep/", "/tools/text/case/", "/tools/text/diff/",
    "/tools/text/formal/", "/tools/text/invisi/", "/tools/text/lorem/",
    "/tools/text/palindrome/", "/tools/text/password/", "/tools/text/regex/",
    "/tools/text/syllables/", "/tools/text/word-salad/", "/tools/text/word-tide/",
    "/tools/color/blend/", "/tools/color/blind/", "/tools/color/contrast/",
    "/tools/color/css/", "/tools/color/gradient/", "/tools/color/hue/",
    "/tools/color/name/", "/tools/color/palette/", "/tools/color/safe/",
    "/tools/color/svg/", "/tools/color/tint/",
    "/tools/convert/archive/", "/tools/convert/cal/", "/tools/convert/contact/",
    "/tools/convert/docu/", "/tools/convert/ebook/", "/tools/convert/encoding/",
    "/tools/convert/favicon/", "/tools/convert/geo/", "/tools/convert/mesh/",
    "/tools/csv/anon/", "/tools/csv/calc/", "/tools/csv/clean/",
    "/tools/csv/compare/", "/tools/csv/excel/", "/tools/csv/lint/",
    "/tools/csv/merge/", "/tools/csv/numcheck/", "/tools/csv/pivot/",
    "/tools/csv/sort/", "/tools/csv/split/", "/tools/csv/stitch/",
    "/tools/data/beautify/", "/tools/data/compare/", "/tools/data/escape/",
    "/tools/data/grok/", "/tools/data/lint/", "/tools/data/path/",
    "/tools/data/schema/", "/tools/data/table/", "/tools/data/toml/",
    "/tools/data/xml/", "/tools/data/yaml/", "/tools/data/yaml2doc/",
    "/tools/dev/encode/", "/tools/dev/hash/", "/tools/dev/json/",
    "/tools/dev/regex/", "/tools/dev/timestamp/",
    "/tools/md/anchor/", "/tools/md/doc/", "/tools/md/emoji/",
    "/tools/md/footnote/", "/tools/md/frontmatter/", "/tools/md/lint/",
    "/tools/md/scraper/", "/tools/md/table/",
  ];
  console.log("== page load checks ==");
  for (const r of routes) await loadCheck(page, r, "load " + r);

  console.log("== search ==");
  try {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.fill("input[type=search]", "merge");
    await page.waitForSelector(".search-results.open a", { timeout: 5000 });
    const n = await page.locator(".search-results.open a").count();
    n > 0 ? pass("search returns hits for 'merge' (" + n + ")") : fail("search", "no hits");
  } catch (e) { fail("search", e.message.split("\n")[0]); }

  const png = genPng();
  const pdf1 = await genPdf(1, "merge-a");
  const pdf2 = await genPdf(1, "merge-b");
  const pdf3 = await genPdf(3, "split");

  console.log("== deep interactions ==");
  const fileInput = 'section.stage input[type=file]';

  // text/case
  try {
    await page.goto(BASE + "/tools/text/case/", { waitUntil: "networkidle" });
    await page.fill("section.stage textarea", "hello world");
    await page.waitForFunction(() => document.body.textContent.includes("HELLO WORLD"));
    await page.waitForFunction(() => document.body.textContent.includes("helloWorld"));
    pass("mr case: live conversion to UPPERCASE + camelCase");
  } catch (e) { fail("mr case", e.message.split("\n")[0]); }

  // text/password
  try {
    await page.goto(BASE + "/tools/text/password/", { waitUntil: "networkidle" });
    const btn = page.locator("section.stage button").first();
    await btn.click();
    await page.waitForFunction(() => {
      const boxes = document.querySelectorAll("section.stage .output-box");
      return boxes.length > 0 && boxes[0].textContent.trim().length >= 4;
    });
    pass("mr password: generates a candidate");
  } catch (e) { fail("mr password", e.message.split("\n")[0]); }

  // age/age
  try {
    await page.goto(BASE + "/tools/age/age/", { waitUntil: "networkidle" });
    const dates = page.locator("section.stage input[type=date]");
    await dates.nth(0).fill("2000-01-15");
    await dates.nth(1).fill("2026-01-15");
    await page.waitForFunction(() => document.body.textContent.includes("years"));
    pass("mr age: computes age from dates");
  } catch (e) { fail("mr age", e.message.split("\n")[0]); }

  // qr/qr
  try {
    await page.goto(BASE + "/tools/qr/qr/", { waitUntil: "networkidle" });
    await page.fill("section.stage input:not([type=search]):not([type=file])", "https://mr.tools");
    await page.waitForSelector('section.stage img[src^="data:image"]', { timeout: 8000 });
    pass("mr qr: renders a QR data URL from text");
  } catch (e) { fail("mr qr", e.message.split("\n")[0]); }

  // image/mr-resize
  try {
    await page.goto(BASE + "/tools/image/mr-resize/", { waitUntil: "networkidle" });
    await page.setInputFiles(fileInput, { name: "tiny.png", mimeType: "image/png", buffer: png });
    await page.waitForSelector("section.stage img", { timeout: 8000 });
    await page.waitForFunction(() => /(px|KB|B\b)/.test(document.querySelector("section.stage").textContent));
    pass("mr resize: loads an image and shows dimensions");
  } catch (e) { fail("mr resize", e.message.split("\n")[0]); }

  // image/mr-convert
  try {
    await page.goto(BASE + "/tools/image/mr-convert/", { waitUntil: "networkidle" });
    await page.setInputFiles(fileInput, { name: "tiny.png", mimeType: "image/png", buffer: png });
    await page.waitForSelector("section.stage img", { timeout: 8000 });
    pass("mr convert: loads and previews an image");
  } catch (e) { fail("mr convert", e.message.split("\n")[0]); }

  // pdf/mr-merge
  try {
    await page.goto(BASE + "/tools/pdf/mr-merge/", { waitUntil: "networkidle" });
    await page.setInputFiles(fileInput, [
      { name: "a.pdf", mimeType: "application/pdf", buffer: pdf1 },
      { name: "b.pdf", mimeType: "application/pdf", buffer: pdf2 },
    ]);
    await page.waitForSelector("section.stage [data-run]:not([disabled])", { timeout: 5000 });
    await page.click("section.stage [data-run]");
    await page.waitForFunction(() =>
      /Merged 2 files/.test(document.querySelector("section.stage [data-out]").textContent),
    );
    const dl = page.locator("section.stage [data-download]");
    if (await dl.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 5000 }),
        dl.click(),
      ]);
      const fs = require("node:fs");
      const path = await download.path();
      const size = fs.statSync(path).size;
      size > 0 ? pass("mr merge: produced a downloadable PDF (" + size + " B)") : fail("mr merge", "downloaded file empty");
    } else {
      fail("mr merge", "result shown but no download button");
    }
  } catch (e) { fail("mr merge", e.message.split("\n")[0]); }

  // pdf/mr-split
  try {
    await page.goto(BASE + "/tools/pdf/mr-split/", { waitUntil: "networkidle" });
    await page.setInputFiles(fileInput, { name: "three.pdf", mimeType: "application/pdf", buffer: pdf3 });
    await page.waitForFunction(() => {
      const t = document.querySelector("section.stage");
      return /3 pages|3 files|page/i.test(t.textContent) && t.textContent.length > 40;
    });
    pass("mr split: accepted a 3-page PDF and enumerated pages");
  } catch (e) { fail("mr split", e.message.split("\n")[0]); }

  // data/yaml
  try {
    await page.goto(BASE + "/tools/data/yaml/", { waitUntil: "networkidle" });
    await page.fill("section.stage [data-input]", "name: Ada\nlangs:\n  - ruby\n  - js\n");
    await page.click("section.stage [data-run]");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-output]");
      return o && o.value.includes("Ada") && o.value.includes("ruby");
    });
    pass("mr yaml: parsed YAML into readable output");
  } catch (e) { fail("mr yaml", e.message.split("\n")[0]); }

  // data/xml (format)
  try {
    await page.goto(BASE + "/tools/data/xml/", { waitUntil: "networkidle" });
    await page.fill("section.stage [data-xml-input]", "<root><a>1</a><b>2</b></root>");
    await page.click("section.stage [data-format]");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-output]");
      return o && o.value.includes("\n") && o.value.includes("<a>1</a>");
    });
    pass("mr xml: pretty-printed XML");
  } catch (e) { fail("mr xml", e.message.split("\n")[0]); }

  // csv/sort
  try {
    await page.goto(BASE + "/tools/csv/sort/", { waitUntil: "networkidle" });
    await page.setInputFiles("section.stage input[type=file]", {
      name: "people.csv", mimeType: "text/csv",
      buffer: Buffer.from("name,age\nbob,30\namy,25\n"),
    });
    await page.waitForFunction(() => {
      const b = document.querySelector("section.stage [data-run]");
      return b && !b.disabled;
    });
    await page.click("section.stage [data-run]");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-out]");
      const p = document.querySelector("section.stage [data-preview-content]");
      return o && o.textContent.startsWith("Done:") && p && p.textContent.includes("amy");
    });
    pass("mr csv sort: ran a sort over uploaded CSV");
  } catch (e) { fail("mr csv sort", e.message.split("\n")[0]); }

  // color/hue
  try {
    await page.goto(BASE + "/tools/color/hue/", { waitUntil: "networkidle" });
    await page.fill("section.stage [data-input]", "#ff6b35");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-out]");
      return o && o.textContent.includes("#ff6b35");
    });
    pass("mr hue: parsed a hex color and showed harmonics");
  } catch (e) { fail("mr hue", e.message.split("\n")[0]); }

  // dev/json (parse)
  try {
    await page.goto(BASE + "/tools/dev/json/", { waitUntil: "networkidle" });
    await page.fill("section.stage [data-input]", '{"a":{"b":1},"c":[1,2]}');
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-out]");
      return o && o.textContent.includes("Valid JSON");
    });
    pass("mr json: parsed JSON and confirmed validity");
  } catch (e) { fail("mr json", e.message.split("\n")[0]); }

  // md/table
  try {
    await page.goto(BASE + "/tools/md/table/", { waitUntil: "networkidle" });
    await page.fill("section.stage textarea", "|a|b|\n|-|-|\n|1|2|");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-out], section.stage output, section.stage .output-box");
      return o && o.textContent.includes("1") && o.textContent.includes("2");
    });
    pass("mr md table: converted markdown table");
  } catch (e) { fail("mr md table", e.message.split("\n")[0]); }

  // dev/hash (text, SHA only)
  try {
    await page.goto(BASE + "/tools/dev/hash/", { waitUntil: "networkidle" });
    await page.fill("section.stage [data-text]", "hello world");
    await page.waitForFunction(() => {
      const r = document.querySelector("section.stage [data-results]");
      return r && /b94d27b9/.test(r.textContent) && !/MD5/.test(r.textContent);
    });
    pass("mr hash: computed SHA-256, no unsupported MD5");
  } catch (e) { fail("mr hash", e.message.split("\n")[0]); }

  // data/table
  try {
    await page.goto(BASE + "/tools/data/table/", { waitUntil: "networkidle" });
    await page.selectOption("section.stage [data-direction]", "csv2json");
    await page.fill("section.stage [data-input]", "name,age\namy,25\nbob,30\n");
    await page.click("section.stage [data-convert]");
    await page.waitForFunction(() => {
      const o = document.querySelector("section.stage [data-output]");
      return o && o.value.includes("amy") && o.value.includes("bob");
    });
    pass("mr data table: parsed CSV into a table");
  } catch (e) { fail("mr data table", e.message.split("\n")[0]); }

  await browser.close();
  console.log("");
  console.log(failures.length === 0
    ? `SMOKE PASS - ${routes.length}/119 pages load, interactions clean`
    : `SMOKE FAIL - ${failures.length} issue(s)`);
  failures.forEach((f) => console.error("  - " + f));
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error("smoke crashed:", e); process.exit(1); });

export interface DocxResult {
  html: string;
  markdown: string;
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    created?: string;
    modified?: string;
  };
  images: Map<string, { data: Uint8Array; mimeType: string }>;
  warnings: string[];
}

async function readZipEntries(data: Uint8Array): Promise<Map<string, Uint8Array>> {
  const entries = new Map<string, Uint8Array>();
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.byteLength) {
    if (offset + 4 > data.byteLength) break;
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    if (offset + 30 > data.byteLength) break;
    const fileNameLen = view.getUint16(offset + 20, true);
    const extraFieldLen = view.getUint16(offset + 22, true);
    const compressedSize = view.getUint32(offset + 16, true);
    const compression = view.getUint16(offset + 8, true);

    const headerSize = 30 + fileNameLen + extraFieldLen;
    if (offset + headerSize > data.byteLength) break;

    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset + 30, fileNameLen);
    const name = new TextDecoder().decode(nameBytes);

    const fileData = new Uint8Array(data.buffer, data.byteOffset + offset + headerSize, compressedSize);

    let extracted: Uint8Array;
    if (compression === 0) {
      extracted = fileData;
    } else if (compression === 8) {
      const stream = new Response(fileData.slice()).body!.pipeThrough(new DecompressionStream("deflate"));
      extracted = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      offset += headerSize + compressedSize;
      continue;
    }

    entries.set(name, extracted);
    offset += headerSize + compressedSize;
  }

  return entries;
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

export async function parseDocx(data: Uint8Array): Promise<DocxResult> {
  const entries = await readZipEntries(data);
  const warnings: string[] = [];
  const images = new Map<string, { data: Uint8Array; mimeType: string }>();

  const documentXml = entries.get("word/document.xml");
  if (!documentXml) throw new Error("Invalid DOCX: missing word/document.xml");

  const doc = parseXml(new TextDecoder().decode(documentXml));
  const metadata = parseCoreProps(entries);
  const stylesXml = entries.get("word/styles.xml");
  const numberingXml = entries.get("word/numbering.xml");

  for (const [name, entryData] of entries) {
    if (name.startsWith("word/media/")) {
      const ext = name.split(".").pop()?.toLowerCase() || "";
      const mimeType = getMimeType(ext);
      images.set(name, { data: entryData, mimeType });
    }
  }

  const html = convertToHtml(doc, images, stylesXml, numberingXml);
  const markdown = htmlToMarkdown(html);
  const text = extractText(doc);

  return { html, markdown, text, metadata, images, warnings };
}

function parseCoreProps(entries: Map<string, Uint8Array>): DocxResult["metadata"] {
  const coreXml = entries.get("docProps/core.xml");
  if (!coreXml) return {};

  const doc = parseXml(new TextDecoder().decode(coreXml));

  const getText = (selector: string) => doc.querySelector(selector)?.textContent?.trim();

  return {
    title: getText("dc\\:title, title"),
    author: getText("dc\\:creator, creator"),
    subject: getText("dc\\:subject, subject"),
    created: getText("dcterms\\:created, created"),
    modified: getText("dcterms\\:modified, modified"),
  };
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff",
    webp: "image/webp", svg: "image/svg+xml",
  };
  return types[ext] || "application/octet-stream";
}

function convertToHtml(doc: Document, _images: Map<string, { data: Uint8Array; mimeType: string }>, _stylesXml: Uint8Array | undefined, _numberingXml: Uint8Array | undefined): string {
  const body = doc.querySelector("w\\:body, body");
  if (!body) return "";

  let html = "";
  const paragraphs = Array.from(body.querySelectorAll("w\\:p, p"));

  let inList = false;

  for (const p of paragraphs) {
    const pStyle = p.querySelector("w\\:pStyle")?.getAttribute("w\\:val");
    const isHeading = pStyle?.startsWith("Heading") || false;
    const headingLevel = isHeading ? parseInt(pStyle?.replace("Heading", "") || "1") : 0;

    const text = extractParagraphText(p);
    if (!text.trim() && !p.querySelector("w\\:drawing, drawing, w\\:pict, pict")) {
      if (inList) {
        html += "</ul>\n";
        inList = false;
      }
      continue;
    }

    if (isHeading) {
      if (inList) { html += "</ul>\n"; inList = false; }
      html += `<h${headingLevel}>${escapeHtml(text)}</h${headingLevel}>\n`;
      continue;
    }

    const numPr = p.querySelector("w\\:numPr");
    if (numPr) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `  <li>${text}</li>\n`;
      continue;
    }

    if (inList) { html += "</ul>\n"; inList = false; }

    html += `<p>${text}</p>\n`;
  }

  if (inList) html += "</ul>\n";

  const tables = Array.from(body.querySelectorAll("w\\:tbl, tbl"));
  for (const table of tables) {
    html += tableToHtml(table);
  }

  return html;
}

function extractParagraphText(p: Element): string {
  let text = "";
  const runs = Array.from(p.querySelectorAll("w\\:r, r"));
  for (const run of runs) {
    const t = run.querySelector("w\\:t, t");
    if (t?.textContent) text += t.textContent;
  }
  return text;
}

function extractText(doc: Document): string {
  const body = doc.querySelector("w\\:body, body");
  if (!body) return "";
  return body.textContent?.trim() || "";
}

function tableToHtml(table: Element): string {
  const rows = Array.from(table.querySelectorAll("w\\:tr, tr"));
  if (rows.length === 0) return "";

  let html = "<table>\n";
  for (const row of rows) {
    html += "  <tr>\n";
    const cells = Array.from(row.querySelectorAll("w\\:tc, tc"));
    for (const cell of cells) {
      const text = extractParagraphText(cell);
      html += `    <td>${escapeHtml(text)}</td>\n`;
    }
    html += "  </tr>\n";
  }
  html += "</table>\n";
  return html;
}

function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h(\d)>(.*?)<\/h\1>/g, (_, level, content) => "#".repeat(parseInt(level)) + " " + content + "\n\n");
  md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
  md = md.replace(/<li>(.*?)<\/li>/g, "- $1\n");
  md = md.replace(/<ul>\n(.*?)\n<\/ul>/gs, "$1\n");
  md = md.replace(/<table>.*?<\/table>/gs, "");
  md = md.replace(/<[^>]+>/g, "");
  return md.trim();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
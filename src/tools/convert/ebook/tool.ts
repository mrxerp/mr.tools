export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;
  publisher?: string;
  date?: string;
  description?: string;
  coverImage?: { data: Uint8Array; mimeType: string };
}

export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  content: string;
  order: number;
  broken?: boolean;
  error?: string;
}

export interface EpubResult {
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  spine: string[];
  manifest: Map<string, { href: string; mimeType: string }>;
  resources: Map<string, Uint8Array>;
  warnings: string[];
}

export interface ExportOptions {
  format: "html" | "markdown" | "text";
  includeMetadata: boolean;
  includeCover: boolean;
  singleFile: boolean;
  chapterSeparator: string;
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function getText(node: Element | null, selector: string): string {
  const el = node?.querySelector(selector);
  return el?.textContent?.trim() || "";
}

function getAttr(node: Element | null, selector: string, attr: string): string {
  const el = node?.querySelector(selector);
  return el?.getAttribute(attr) || "";
}

export async function parseEpub(data: Uint8Array): Promise<EpubResult> {
  const warnings: string[] = [];
  const resources = new Map<string, Uint8Array>();
  const manifest = new Map<string, { href: string; mimeType: string }>();

  const entries = await readZipEntries(data);
  const containerXml = entries.get("META-INF/container.xml");
  if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");

  const containerDoc = parseXml(new TextDecoder().decode(containerXml));
  const rootfile = containerDoc.querySelector("rootfile");
  const opfPath = rootfile?.getAttribute("full-path") || "OEBPS/content.opf";
  const opfData = entries.get(opfPath);
  if (!opfData) throw new Error(`Invalid EPUB: missing ${opfPath}`);

  const opfDoc = parseXml(new TextDecoder().decode(opfData));
  const opfBase = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

  const metadata = parseMetadata(opfDoc);
  const { manifest: manifestMap, spine } = parseManifestAndSpine(opfDoc, opfBase);

  for (const [id, item] of manifestMap) {
    const fullPath = opfBase + item.href;
    const resourceData = entries.get(fullPath);
    if (resourceData) {
      resources.set(id, resourceData);
      manifest.set(id, item);
    } else {
      warnings.push(`Missing resource: ${fullPath}`);
    }
  }

  const chapters: EpubChapter[] = [];
  for (let i = 0; i < spine.length; i++) {
    const idref = spine[i];
    const item = manifestMap.get(idref);
    if (!item) continue;

    const fullPath = opfBase + item.href;
    const contentData = entries.get(fullPath);
    if (!contentData) {
      chapters.push({ id: idref, title: "", href: item.href, content: "", order: i, broken: true, error: "Content not found" });
      continue;
    }

    try {
      const content = new TextDecoder().decode(contentData);
      const doc = parseXml(content);
      const title = extractTitle(doc, item.href);
      const html = cleanHtml(doc, opfBase, resources, manifestMap);
      chapters.push({ id: idref, title, href: item.href, content: html, order: i });
    } catch (e) {
      chapters.push({ id: idref, title: "", href: item.href, content: "", order: i, broken: true, error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (metadata.coverImage) {
    const coverId = Array.from(manifest.entries()).find(([, v]) => v.href === metadata.coverImage?.mimeType)?.[0];
    if (coverId && resources.has(coverId)) {
      metadata.coverImage = { data: resources.get(coverId)!, mimeType: manifest.get(coverId)?.mimeType || "image/jpeg" };
    }
  }

  return { metadata, chapters, spine, manifest, resources, warnings };
}

function parseMetadata(doc: Document): EpubMetadata {
  const ns = { opf: "http://www.idpf.org/2007/opf", dc: "http://purl.org/dc/elements/1.1/" };
  const meta = doc.querySelector("metadata");
  return {
    title: getText(meta, "dc\\:title, title"),
    author: getText(meta, "dc\\:creator, creator"),
    language: getText(meta, "dc\\:language, language"),
    identifier: getText(meta, "dc\\:identifier, identifier"),
    publisher: getText(meta, "dc\\:publisher, publisher"),
    date: getText(meta, "dc\\:date, date"),
    description: getText(meta, "dc\\:description, description"),
  };
}

function parseManifestAndSpine(doc: Document, base: string) {
  const manifest = new Map<string, { href: string; mimeType: string }>();
  const spine: string[] = [];

  const manifestEl = doc.querySelector("manifest");
  manifestEl?.querySelectorAll("item").forEach(item => {
    const id = item.getAttribute("id")!;
    const href = item.getAttribute("href")!;
    const mimeType = item.getAttribute("media-type") || "";
    manifest.set(id, { href, mimeType });
  });

  const spineEl = doc.querySelector("spine");
  spineEl?.querySelectorAll("itemref").forEach(itemref => {
    const idref = itemref.getAttribute("idref")!;
    spine.push(idref);
  });

  return { manifest, spine };
}

function extractTitle(doc: Document, href: string): string {
  const titleEl = doc.querySelector("title");
  if (titleEl?.textContent?.trim()) return titleEl.textContent.trim();

  const h1 = doc.querySelector("h1");
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  return href.split("/").pop()?.replace(/\.[^.]+$/, "") || "Chapter";
}

function cleanHtml(doc: Document, base: string, resources: Map<string, Uint8Array>, manifest: Map<string, { href: string; mimeType: string }>): string {
  const body = doc.querySelector("body") || doc.documentElement;

  body.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src");
    if (!src) return;
    const fullSrc = new URL(src, base).pathname.split("/").pop() || src;
    const resourceId = Array.from(manifest.entries()).find(([, v]) => v.href === fullSrc || v.href.endsWith("/" + fullSrc))?.[0];
    if (resourceId && resources.has(resourceId)) {
      const data = resources.get(resourceId)!;
      const mimeType = manifest.get(resourceId)?.mimeType || "image/jpeg";
      const b64 = bytesToBase64(data);
      img.setAttribute("src", `data:${mimeType};base64,${b64}`);
    }
  });

  body.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href")!;
    if (href.startsWith("#")) return;
    const fullHref = new URL(href, base).pathname.split("/").pop() || href;
    a.setAttribute("data-original-href", href);
    a.setAttribute("href", "#" + fullHref.replace(/\.[^.]+$/, ""));
  });

  return body.innerHTML;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

export function exportEpub(result: EpubResult, options: ExportOptions): string | { files: Map<string, string>; main: string } {
  const { format, includeMetadata, includeCover, singleFile, chapterSeparator } = options;

  const chapters = result.chapters.filter(c => !c.broken).map(c => c.content);
  const brokenCount = result.chapters.filter(c => c.broken).length;

  let content = "";
  if (format === "html") {
    content = exportHtml(result, chapters, includeMetadata, includeCover, chapterSeparator, brokenCount);
  } else if (format === "markdown") {
    content = exportMarkdown(result, chapters, includeMetadata, includeCover, chapterSeparator, brokenCount);
  } else {
    content = exportText(result, chapters, includeMetadata, chapterSeparator, brokenCount);
  }

  if (singleFile) {
    return content;
  }

  const files = new Map<string, string>();
  files.set("index.html", content);
  return { files, main: "index.html" };
}

function exportHtml(result: EpubResult, chapters: string[], includeMetadata: boolean, includeCover: boolean, separator: string, brokenCount: number): string {
  const meta = result.metadata;
  let html = `<!DOCTYPE html><html lang="${meta.language || "en"}"><head><meta charset="UTF-8"><title>${escapeHtml(meta.title)}</title>`;
  html += `<style>body{font-family:system-ui,serif;max-width:42rem;margin:0 auto;padding:2rem;line-height:1.7}img{max-width:100%;height:auto}h1,h2,h3{line-height:1.3}.chapter{border-top:1px solid #eee;padding-top:2rem;margin-top:2rem}.meta{color:#666;font-size:0.9rem;margin-bottom:1rem}.warning{background:#fff3cd;padding:0.5rem;border-radius:4px;margin-bottom:1rem}</style></head><body>`;

  if (includeMetadata) {
    html += `<div class="meta"><h1>${escapeHtml(meta.title)}</h1>`;
    if (meta.author) html += `<p>By ${escapeHtml(meta.author)}</p>`;
    if (meta.publisher) html += `<p>${escapeHtml(meta.publisher)}</p>`;
    if (meta.date) html += `<p>${escapeHtml(meta.date)}</p>`;
    if (meta.description) html += `<p>${escapeHtml(meta.description)}</p>`;
    html += `</div>`;
  }

  if (includeCover && meta.coverImage) {
    const b64 = bytesToBase64(meta.coverImage.data);
    html += `<div style="text-align:center;margin:2rem 0"><img src="data:${meta.coverImage.mimeType};base64,${b64}" alt="Cover" style="max-width:100%;height:auto"></div>`;
  }

  if (brokenCount > 0) {
    html += `<div class="warning">Warning: ${brokenCount} chapter${brokenCount !== 1 ? "s" : ""} could not be parsed and were skipped.</div>`;
  }

  html += chapters.map((c, i) => `<div class="chapter" id="ch${i}">${c}</div>`).join(separator);
  html += `</body></html>`;
  return html;
}

function exportMarkdown(result: EpubResult, chapters: string[], includeMetadata: boolean, includeCover: boolean, separator: string, brokenCount: number): string {
  const meta = result.metadata;
  let md = "";

  if (includeMetadata) {
    md += `# ${escapeHtml(meta.title)}\n\n`;
    if (meta.author) md += `**Author:** ${escapeHtml(meta.author)}\n\n`;
    if (meta.publisher) md += `**Publisher:** ${escapeHtml(meta.publisher)}\n\n`;
    if (meta.date) md += `**Date:** ${escapeHtml(meta.date)}\n\n`;
    if (meta.description) md += `${escapeHtml(meta.description)}\n\n`;
    md += "---\n\n";
  }

  if (includeCover && meta.coverImage) {
    const b64 = bytesToBase64(meta.coverImage.data);
    md += `![Cover](data:${meta.coverImage.mimeType};base64,${b64})\n\n`;
  }

  if (brokenCount > 0) {
    md += `> **Warning:** ${brokenCount} chapter${brokenCount !== 1 ? "s" : ""} could not be parsed and were skipped.\n\n`;
  }

  const chapterMd = chapters.map((c, i) => {
    const doc = new DOMParser().parseFromString(c, "text/html");
    return htmlToMarkdown(doc.body);
  });

  md += chapterMd.join(separator);
  return md;
}

function exportText(result: EpubResult, chapters: string[], includeMetadata: boolean, separator: string, brokenCount: number): string {
  const meta = result.metadata;
  let text = "";

  if (includeMetadata) {
    text += `${meta.title}\n`;
    if (meta.author) text += `By ${meta.author}\n`;
    if (meta.publisher) text += `${meta.publisher}\n`;
    if (meta.date) text += `${meta.date}\n`;
    if (meta.description) text += `\n${meta.description}\n`;
    text += "\n---\n\n";
  }

  if (brokenCount > 0) {
    text += `[Warning: ${brokenCount} chapter${brokenCount !== 1 ? "s" : ""} could not be parsed and were skipped.]\n\n`;
  }

  const chapterText = chapters.map(c => {
    const doc = new DOMParser().parseFromString(c, "text/html");
    return doc.body.textContent || "";
  });

  text += chapterText.join(separator);
  return text;
}

function htmlToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  let content = Array.from(el.childNodes).map(htmlToMarkdown).join("");

  switch (tag) {
    case "h1": return `# ${content.trim()}\n\n`;
    case "h2": return `## ${content.trim()}\n\n`;
    case "h3": return `### ${content.trim()}\n\n`;
    case "h4": return `#### ${content.trim()}\n\n`;
    case "p": return `${content.trim()}\n\n`;
    case "br": return "\n";
    case "strong": case "b": return `**${content}**`;
    case "em": case "i": return `*${content}*`;
    case "code": return `\`${content}\``;
    case "pre": return `\n\`\`\`\n${content}\n\`\`\`\n\n`;
    case "blockquote": return content.split("\n").map(l => `> ${l}`).join("\n") + "\n\n";
    case "ul": return Array.from(el.querySelectorAll(":scope > li")).map(li => `- ${htmlToMarkdown(li).trim()}`).join("\n") + "\n\n";
    case "ol": return Array.from(el.querySelectorAll(":scope > li")).map((li, i) => `${i + 1}. ${htmlToMarkdown(li).trim()}`).join("\n") + "\n\n";
    case "li": return content.trim();
    case "a": return `[${content}](${el.getAttribute("href") || ""})`;
    case "img": return `![${el.getAttribute("alt") || ""}](${el.getAttribute("src") || ""})`;
    case "hr": return "---\n\n";
    default: return content;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
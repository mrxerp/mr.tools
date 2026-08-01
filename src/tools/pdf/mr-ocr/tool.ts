import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export interface TextItemLike {
  str?: string;
  hasEOL?: boolean;
}

export function cleanPageText(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ \n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function assemblePageText(items: TextItemLike[]): string {
  let out = "";
  for (const item of items) {
    out += item.str ?? "";
    if (item.hasEOL) out += "\n";
  }
  return cleanPageText(out);
}

export function toUint8(bytes: ArrayBuffer | Uint8Array): Uint8Array {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

export async function extractTextLayer(bytes: ArrayBuffer | Uint8Array): Promise<string[]> {
  const doc = await pdfjsLib.getDocument({ data: toUint8(bytes).slice() }).promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(assemblePageText(content.items as TextItemLike[]));
    }
    return pages;
  } finally {
    doc.destroy();
  }
}

export type InvisibleKind =
  | "space"
  | "tab"
  | "newline"
  | "cr"
  | "nbsp"
  | "other-space"
  | "zero-width"
  | "bom"
  | "control";

export interface CharCell {
  char: string;
  kind: InvisibleKind | "visible";
}

export interface InvisibleChar extends CharCell {
  index: number;
  code: string;
  name: string;
}

function kindOf(cp: number): { kind: InvisibleKind; name: string } | null {
  if (cp === 0x09) return { kind: "tab", name: "Tab" };
  if (cp === 0x0a) return { kind: "newline", name: "Line feed (LF)" };
  if (cp === 0x0d) return { kind: "cr", name: "Carriage return (CR)" };
  if (cp === 0x20) return { kind: "space", name: "Space" };
  if (cp === 0xa0 || cp === 0x202f || cp === 0x2007) {
    return { kind: "nbsp", name: "No-break space" };
  }
  if (cp >= 0x2000 && cp <= 0x200a) return { kind: "other-space", name: "Unicode space" };
  if (cp === 0x200b || cp === 0x200c || cp === 0x200d) {
    return { kind: "zero-width", name: "Zero-width character" };
  }
  if (cp === 0xfeff) return { kind: "bom", name: "Byte order mark (BOM)" };
  if (cp < 0x20 || cp === 0x7f) return { kind: "control", name: "Control character" };
  return null;
}

export function charMap(text: string): CharCell[] {
  const out: CharCell[] = [];
  for (const ch of text) {
    const info = kindOf(ch.codePointAt(0) ?? 0);
    out.push({ char: ch, kind: info ? info.kind : "visible" });
  }
  return out;
}

export function detectInvisible(text: string): InvisibleChar[] {
  const out: InvisibleChar[] = [];
  let index = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const info = kindOf(cp);
    if (info) {
      out.push({
        index,
        char: ch,
        kind: info.kind,
        name: info.name,
        code: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      });
    }
    index += ch.length;
  }
  return out;
}

export function cleanText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b\u200c\u200d]/g, "")
    .replace(/\ufeff/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

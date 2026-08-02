export interface Heading {
  level: number;
  text: string;
  anchor: string;
}

export interface TOCEntry {
  level: number;
  text: string;
  anchor: string;
  children?: TOCEntry[];
}

export interface AnchorResult {
  headings: Heading[];
  toc: TOCEntry[];
  markdownWithAnchors: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

function processMarkdown(markdown: string): AnchorResult {
  const lines = markdown.split("\n");
  const headings: Heading[] = [];
  const headingMap = new Map<string, number>();
  const out: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      out.push(line);
      continue;
    }
    const level = match[1].length;
    const text = match[2];
    const base = slugify(text);
    const count = headingMap.get(base) || 0;
    headingMap.set(base, count + 1);
    const anchor = count === 0 ? base : `${base}-${count}`;
    headings.push({ level, text, anchor });
    out.push(`${match[1]} <a id="${anchor}"></a> ${text}`);
  }

  const toc: TOCEntry[] = headings.map((h) => ({ level: h.level, text: h.text, anchor: h.anchor }));

  return { headings, toc, markdownWithAnchors: out.join("\n") };
}

export { processMarkdown };
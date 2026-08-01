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
  const headingMap = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const anchor = slugify(text);
      const counter = headingMap.get(anchor) || 0;
      const finalAnchor = counter === 0 ? anchor : `${anchor}-${counter}`;
      headingMap.set(anchor, (counter + 1).toString());
      headings.push({ level, text, anchor: finalAnchor });
    }
  }

  const toc: TOCEntry[] = [];
  const stack: TOCEntry[] = [];
  for (const heading of headings) {
    const entry: TOCEntry = {
      level: heading.level,
      text: heading.text,
      anchor: heading.anchor,
    };
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      toc.push(entry);
    } else {
      stack[stack.length - 1].children = stack[stack.length - 1].children || [];
      stack[stack.length - 1].children.push(entry);
    }
    stack.push(entry);
  }

  const markdownWithAnchors = lines
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const anchor = slugify(text);
        const counter = headingMap.get(anchor) || 0;
        const finalAnchor = counter === 0 ? anchor : `${anchor}-${counter}`;
        return `${match[1]} <a id="${finalAnchor}"></a> ${text}`;
      }
      return line;
    })
    .join("\n");

  return { headings, toc, markdownWithAnchors };
}

export { processMarkdown };
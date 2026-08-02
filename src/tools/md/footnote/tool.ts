export interface FootnoteResult {
  markdown: string;
  warnings: string[];
}

const FOOTNOTE_REF_RE = /\[\^([^\]]+)\](?!\s*:)/g;
const FOOTNOTE_DEF_RE = /^\[\^([^\]]+)\]:\s*(.*)$/gm;

export function renumberFootnotes(markdown: string): FootnoteResult {
  const warnings: string[] = [];
  const refs = new Map<string, number>();
  const defs = new Map<string, string>();
  let defOrder: string[] = [];

  for (const match of markdown.matchAll(FOOTNOTE_DEF_RE)) {
    const key = match[1];
    const content = match[2];
    if (!defs.has(key)) {
      defs.set(key, content);
      defOrder.push(key);
    } else {
      warnings.push(`Duplicate footnote definition: [^${key}]`);
    }
  }

  const usedRefs = new Set<string>();
  for (const match of markdown.matchAll(FOOTNOTE_REF_RE)) {
    usedRefs.add(match[1]);
  }

  for (const key of usedRefs) {
    if (!defs.has(key)) {
      warnings.push(`Missing footnote definition for [^${key}]`);
      defs.set(key, "[MISSING DEFINITION]");
      defOrder.push(key);
    }
  }

  for (const key of defOrder) {
    if (!usedRefs.has(key)) {
      warnings.push(`Unused footnote definition: [^${key}]`);
    }
  }

  const orderedDefs = defOrder.filter((k) => usedRefs.has(k));
  for (let i = 0; i < orderedDefs.length; i++) {
    refs.set(orderedDefs[i], i + 1);
  }
  for (const key of defOrder) {
    if (!usedRefs.has(key)) refs.set(key, refs.size + 1);
  }

  let result = markdown.replace(FOOTNOTE_REF_RE, (_, key) => {
    const num = refs.get(key);
    return num ? `[^${num}]` : `[^${key}]`;
  });

  result = result.replace(FOOTNOTE_DEF_RE, (_, key, content) => {
    const num = refs.get(key);
    if (num) return `[^${num}]: ${content}`;
    return `[^${key}]: ${content}`;
  });

  return { markdown: result, warnings };
}

export function inlineToReference(markdown: string): FootnoteResult {
  const warnings: string[] = [];
  const linkMap = new Map<string, string>();
  let linkCounter = 0;

  const inlineLinkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let result = markdown.replace(inlineLinkRe, (_, text, url) => {
    if (linkMap.has(url)) {
      return `[${text}][${linkMap.get(url)}]`;
    }
    linkCounter++;
    const ref = String(linkCounter);
    linkMap.set(url, ref);
    return `[${text}][${ref}]`;
  });

  if (linkCounter > 0) {
    const refs = Array.from(linkMap.entries())
      .map(([url, ref]) => `[${ref}]: ${url}`)
      .join("\n");
    result = result.trimEnd() + "\n\n" + refs;
  }

  return { markdown: result, warnings };
}

export function referenceToInline(markdown: string): FootnoteResult {
  const warnings: string[] = [];
  const refMap = new Map<string, string>();
  const refDefRe = /^\[([^\]]+)\]:\s*(\S+)/gm;

  for (const match of markdown.matchAll(refDefRe)) {
    refMap.set(match[1], match[2]);
  }

  let result = markdown.replace(refDefRe, "");
  result = result.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (_, text, ref) => {
    const url = refMap.get(ref);
    if (url) return `[${text}](${url})`;
    warnings.push(`Unknown reference: [${ref}]`);
    return `[${text}][${ref}]`;
  });

  return { markdown: result.trim(), warnings };
}
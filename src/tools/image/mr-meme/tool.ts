/** Meme text layout math. Deterministic, no DOM. */

export const CHAR_WIDTH_FACTOR = 0.58;

export function memeText(text: string): string {
  return text.trim().toUpperCase();
}

export function wrapLines(text: string, maxChars: number): string[] {
  const max = Math.max(1, maxChars);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (let word of words) {
    while (word.length > max) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, max));
      word = word.slice(max);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= max || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks a requested font size so the longest line fits the width. */
export function fitFontSize(width: number, lines: string[], size: number): number {
  const maxChars = lines.reduce((m, l) => Math.max(m, l.length), 0);
  if (maxChars <= 0) return Math.max(12, Math.round(size));
  const fit = Math.floor((width * 0.94) / (maxChars * CHAR_WIDTH_FACTOR));
  return Math.max(12, Math.min(Math.max(12, Math.round(size)), fit));
}

/** Total block height (px) for a set of wrapped lines at a given size. */
export function textBlockHeight(lines: string[], size: number, lineGap: number): number {
  if (lines.length === 0) return 0;
  return lines.length * size + (lines.length - 1) * size * lineGap;
}

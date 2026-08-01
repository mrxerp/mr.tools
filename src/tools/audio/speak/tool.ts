/** Splits long text into utterance-sized chunks so speechSynthesis doesn't cut off. */

export function chunkSpeech(text: string, maxChars = 4000): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const chunks: string[] = [];
  let rest = trimmed;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf(". ", maxChars);
    if (cut < maxChars * 0.5) cut = rest.lastIndexOf(" ", maxChars);
    let chunk: string;
    if (cut >= 1) {
      chunk = rest.slice(0, cut + 1).trim();
    } else {
      chunk = rest.slice(0, maxChars);
    }
    chunks.push(chunk);
    rest = rest.slice(chunk.length).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export type LoremStyle = "classic" | "techy" | "pirate" | "product";

const WORDS: Record<LoremStyle, string[]> = {
  classic: [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
    "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
    "et", "dolore", "magna", "aliqua", "enim", "minim", "veniam", "quis",
    "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "commodo",
  ],
  techy: [
    "array", "buffer", "cache", "compile", "dependency", "endpoint", "framework",
    "function", "git", "hash", "index", "kernel", "lambda", "module", "node",
    "object", "protocol", "queue", "regex", "server", "socket", "thread", "token",
    "variable", "webhook",
  ],
  pirate: [
    "ahoy", "matey", "booty", "treasure", "anchor", "ashore", "barnacle",
    "capsize", "deck", "fathom", "galleon", "harbor", "jolly", "landlocked",
    "mutiny", "ocean", "plank", "rum", "sail", "ship", "shoal", "storm",
    "voyage", "waves", "winds",
  ],
  product: [
    "customer", "growth", "feature", "launch", "market", "metrics", "revenue",
    "roadmap", "team", "traction", "users", "velocity", "backlog", "sprint",
    "synergy", "impact", "value", "conversion", "retention", "funnel",
  ],
};

export interface LoremOptions {
  paragraphs: number;
  sentencesPerParagraph: number;
  seed: number;
  style: LoremStyle;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loremWords(n: number, options: LoremOptions): string {
  const count = Math.max(1, Math.round(n));
  const words = WORDS[options.style];
  const rand = mulberry32(options.seed + 2);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(words[Math.floor(rand() * words.length)]);
  return out.join(" ");
}

export function loremSentences(n: number, options: LoremOptions): string {
  const count = Math.max(1, Math.round(n));
  const words = WORDS[options.style];
  const rand = mulberry32(options.seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(sentence(words, rand));
  return out.join(" ");
}

export function loremParagraphs(options: LoremOptions): string {
  const count = Math.max(1, Math.round(options.paragraphs));
  const words = WORDS[options.style];
  const rand = mulberry32(options.seed + 1);
  const out: string[] = [];
  for (let p = 0; p < count; p++) {
    const per =
      options.sentencesPerParagraph > 0
        ? options.sentencesPerParagraph
        : 4 + Math.floor(rand() * 3);
    const parts: string[] = [];
    for (let i = 0; i < per; i++) parts.push(sentence(words, rand));
    out.push(parts.join(" "));
  }
  return out.join("\n\n");
}

function sentence(words: string[], rand: () => number): string {
  const n = 8 + Math.floor(rand() * 8);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(words[Math.floor(rand() * words.length)]);
  const s = parts.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

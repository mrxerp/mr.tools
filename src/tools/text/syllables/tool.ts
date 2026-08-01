const VOWELS = "aeiouy";

const OVERRIDES: Record<string, number> = {
  everything: 4,
  business: 2,
  every: 2,
  people: 2,
  poem: 2,
  poetry: 3,
};

export interface SyllableWord {
  word: string;
  syllables: string[];
  count: number;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (OVERRIDES[w] !== undefined) return OVERRIDES[w];
  let n = 0;
  let prevVowel = false;
  for (const c of w) {
    const v = VOWELS.includes(c);
    if (v && !prevVowel) n++;
    prevVowel = v;
  }
  if (w.length >= 2 && w.endsWith("e")) {
    const before = w[w.length - 2];
    const groupSingle = w.length < 4 || !VOWELS.includes(w[w.length - 4]);
    if (!VOWELS.includes(before) && !w.endsWith("le") && groupSingle) n--;
  }
  return Math.max(n, 1);
}

export function splitWord(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return [];
  const target = countSyllables(w);
  if (target <= 1 || w.length <= 3) return [w];
  const cuts: number[] = [];
  let seenVowel = VOWELS.includes(w[0]);
  for (let i = 1; i < w.length; i++) {
    if (!VOWELS.includes(w[i])) continue;
    if (VOWELS.includes(w[i - 1])) continue;
    if (!seenVowel) {
      seenVowel = true;
      continue;
    }
    let cStart = i - 1;
    while (cStart > 0 && !VOWELS.includes(w[cStart - 1])) cStart--;
    const clusterLen = i - cStart;
    const trailingCle = i === w.length - 1 && w[i] === "e" && /^[^aeiouy]+e$/.test(w.slice(cStart));
    const cut = trailingCle ? cStart : clusterLen >= 2 ? cStart + 1 : cStart;
    if (cut > 0 && cut < w.length) cuts.push(cut);
    seenVowel = true;
  }
  let parts = build(w, cuts);
  while (parts.length > target && cuts.length > 0) {
    cuts.pop();
    parts = build(w, cuts);
  }
  while (parts.length < target && parts.length > 1) {
    let longest = 0;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length > parts[longest].length) longest = i;
    }
    const p = parts[longest];
    let at = -1;
    for (let i = 1; i < p.length; i++) {
      if (VOWELS.includes(p[i]) && !VOWELS.includes(p[i - 1])) {
        at = i;
        break;
      }
    }
    if (at <= 0) break;
    parts.splice(longest, 1, p.slice(0, at), p.slice(at));
  }
  return parts;
}

export function syllabify(text: string): SyllableWord[] {
  const out: SyllableWord[] = [];
  for (const m of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    const parts = splitWord(m);
    out.push({ word: m, syllables: parts, count: parts.length });
  }
  return out;
}

export function totalSyllables(text: string): number {
  let n = 0;
  for (const m of text.toLowerCase().match(/[a-z']+/g) ?? []) n += splitWord(m).length;
  return n;
}

function build(w: string, cuts: number[]): string[] {
  const sorted = [...new Set(cuts)].sort((a, b) => a - b);
  const parts: string[] = [];
  let prev = 0;
  for (const c of sorted) {
    if (c <= prev) continue;
    parts.push(w.slice(prev, c));
    prev = c;
  }
  parts.push(w.slice(prev));
  return parts.filter((p) => p.length > 0);
}

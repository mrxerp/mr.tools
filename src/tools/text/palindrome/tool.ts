export function isPalindrome(s: string): boolean {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return t.length > 0 && t === [...t].reverse().join("");
}

export function findPalindromes(text: string, minLen = 3): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (w.length >= minLen && !seen.has(w) && isPalindrome(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

export function anagramsOf(word: string, corpus: string): string[] {
  const target = word.toLowerCase().replace(/[^a-z]/g, "");
  const key = (s: string) => [...s].sort().join("");
  const tk = key(target);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of corpus.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (w === target || w.length !== target.length) continue;
    if (key(w) === tk && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

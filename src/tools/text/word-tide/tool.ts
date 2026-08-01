export interface TextStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  sentences: number;
  paragraphs: number;
  avgWordLength: number;
  readingMinutes: number;
  readingSeconds: number;
  speakingMinutes: number;
  speakingSeconds: number;
  flesch: number | null;
  fleschLabel: string;
  fog: number | null;
}

const READING_WPM = 200;
const SPEAKING_WPM = 130;

export function countWords(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length;
}

export function countSentences(text: string): number {
  const ends = (text.match(/[^.!?]+[.!?]+/g) ?? []).length;
  return ends > 0 ? ends : text.trim() ? 1 : 0;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let n = 0;
  let prevVowel = false;
  for (const c of w) {
    const v = "aeiouy".includes(c);
    if (v && !prevVowel) n++;
    prevVowel = v;
  }
  if (w.length >= 2 && w.endsWith("e")) {
    const before = w[w.length - 2];
    const groupSingle = w.length < 4 || !"aeiouy".includes(w[w.length - 4]);
    if (!"aeiouy".includes(before) && !w.endsWith("le") && groupSingle) n--;
  }
  return Math.max(n, 1);
}

export function flesch(words: number, sentences: number, syllables: number): number {
  if (words === 0 || sentences === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

export function fleschLabel(score: number): string {
  if (score >= 90) return "Very easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

export function gunningFog(words: number, sentences: number, complexWords: number): number {
  if (words === 0 || sentences === 0) return 0;
  return 0.4 * (words / sentences + 100 * (complexWords / words));
}

export function analyze(text: string): TextStats {
  const words = countWords(text);
  const sentences = Math.max(countSentences(text), 1);
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const syllables = totalSyllables(text);
  const complex = complexWords(text);
  const readingSec = Math.round((words / READING_WPM) * 60);
  const speakingSec = Math.round((words / SPEAKING_WPM) * 60);
  const f = words === 0 ? null : Math.round(flesch(words, sentences, syllables) * 100) / 100;
  return {
    words,
    chars,
    charsNoSpaces,
    sentences,
    paragraphs,
    avgWordLength: words === 0 ? 0 : Math.round((charsNoSpaces / words) * 100) / 100,
    readingMinutes: Math.floor(readingSec / 60),
    readingSeconds: readingSec % 60,
    speakingMinutes: Math.floor(speakingSec / 60),
    speakingSeconds: speakingSec % 60,
    flesch: f,
    fleschLabel: f === null ? "" : fleschLabel(f),
    fog: words === 0 ? null : Math.round(gunningFog(words, sentences, complex) * 100) / 100,
  };
}

function totalSyllables(text: string): number {
  let n = 0;
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) n += countSyllables(w);
  return n;
}

function complexWords(text: string): number {
  let n = 0;
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) if (countSyllables(w) >= 3) n++;
  return n;
}

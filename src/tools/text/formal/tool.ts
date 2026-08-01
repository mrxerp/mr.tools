export interface FormalResult {
  text: string;
  contractions: number;
  slang: number;
}

const CONTRACTIONS: Record<string, string> = {
  "can't": "cannot",
  "won't": "will not",
  "couldn't": "could not",
  "shouldn't": "should not",
  "wouldn't": "would not",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "i'm": "I am",
  "i've": "I have",
  "i'll": "I will",
  "i'd": "I would",
  "you're": "you are",
  "you've": "you have",
  "you'll": "you will",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "we're": "we are",
  "we've": "we have",
  "we'll": "we will",
  "they're": "they are",
  "they've": "they have",
  "they'll": "they will",
  "let's": "let us",
  "that's": "that is",
  "there's": "there is",
  "what's": "what is",
  "who's": "who is",
};

const SLANG: Record<string, string> = {
  gonna: "going to",
  wanna: "want to",
  gotta: "have to",
  kinda: "kind of",
  sorta: "sort of",
  lotsa: "a lot of",
  dunno: "do not know",
  yeah: "yes",
  yep: "yes",
  nah: "no",
  nope: "no",
  hi: "hello",
  hey: "hello",
  bye: "goodbye",
  u: "you",
  ur: "your",
  cuz: "because",
  bc: "because",
  thx: "thank you",
  plz: "please",
  pls: "please",
  omg: "oh my goodness",
  btw: "by the way",
  idk: "I do not know",
  tbh: "to be honest",
  imo: "in my opinion",
  rn: "right now",
  guys: "everyone",
  kids: "children",
};

export function expandContractions(text: string): string {
  return replaceWords(text, CONTRACTIONS).text;
}

export function replaceSlang(text: string): string {
  return replaceWords(text, SLANG).text;
}

export function formalize(text: string): string {
  return formalizeWithStats(text).text;
}

export function formalizeWithStats(text: string): FormalResult {
  const c = replaceWords(text, CONTRACTIONS);
  const s = replaceWords(c.text, SLANG);
  return { text: polish(s.text), contractions: c.count, slang: s.count };
}

function replaceWords(text: string, dict: Record<string, string>): { text: string; count: number } {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  const pattern = keys.map(escapeRe).join("|");
  const re = new RegExp(`\\b(${pattern})\\b`, "gi");
  let count = 0;
  const out = text.replace(re, (m) => {
    count++;
    return dict[m.toLowerCase()] ?? m;
  });
  return { text: out, count };
}

function polish(text: string): string {
  return text
    .replace(/\bi\b/g, "I")
    .replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

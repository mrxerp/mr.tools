export interface BleepOptions {
  customWords?: string[];
  censor?: (word: string) => string;
}

const DEFAULT_WORDS = [
  "ass", "asshole", "assholes", "bastard", "bastards", "bitch", "bitches",
  "bollocks", "bullshit", "crap", "cunt", "damn", "damned", "dick", "dicks",
  "fuck", "fucked", "fucker", "fucking", "fucks", "goddamn", "hell", "nigger",
  "piss", "pissed", "shit", "shits", "shitty", "slut", "whore", "wanker",
];

export function censorWord(word: string): string {
  return "*".repeat(word.length);
}

export function bleepText(text: string, options: BleepOptions = {}): string {
  const censor = options.censor ?? censorWord;
  const re = reFor(options);
  return text.replace(re, (m) => censor(m));
}

export function detectBleeps(text: string, options: BleepOptions = {}): string[] {
  const re = reFor(options);
  const out: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const w = m[1].toLowerCase();
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

function reFor(options: BleepOptions): RegExp {
  const words = options.customWords ?? DEFAULT_WORDS;
  const pattern = words.map(escapeRe).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

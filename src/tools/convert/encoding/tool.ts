export interface EncodingResult {
  encoding: string;
  confidence: number;
  alternativeEncodings: Array<{ encoding: string; confidence: number }>;
  convertedText: string;
  mojibakeDetected: boolean;
  mojibakeRepair?: { original: string; repaired: string; explanation: string };
}

const ENCODINGS = [
  { name: "utf-8", detector: detectUtf8 },
  { name: "utf-16le", detector: detectUtf16Le },
  { name: "utf-16be", detector: detectUtf16Be },
  { name: "iso-8859-1", detector: detectLatin1 },
  { name: "shift_jis", detector: detectShiftJis },
  { name: "windows-1252", detector: detectWin1252 },
];

function detectUtf8(data: Uint8Array): number {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(data);
    return 1.0;
  } catch {
    return 0.0;
  }
}

function detectUtf16Le(data: Uint8Array): number {
  if (data.length < 2 || data.length % 2 !== 0) return 0.0;
  if (data[0] === 0xFF && data[1] === 0xFE) return 0.95;
  try {
    new TextDecoder("utf-16le", { fatal: true }).decode(data);
    return 0.8;
  } catch {
    return 0.0;
  }
}

function detectUtf16Be(data: Uint8Array): number {
  if (data.length < 2 || data.length % 2 !== 0) return 0.0;
  if (data[0] === 0xFE && data[1] === 0xFF) return 0.95;
  try {
    new TextDecoder("utf-16be", { fatal: true }).decode(data);
    return 0.8;
  } catch {
    return 0.0;
  }
}

function detectLatin1(data: Uint8Array): number {
  try {
    new TextDecoder("iso-8859-1", { fatal: true }).decode(data);
    return 0.3;
  } catch {
    return 0.0;
  }
}

function detectShiftJis(data: Uint8Array): number {
  let score = 0;
  for (let i = 0; i < data.length - 1; i++) {
    const b1 = data[i];
    if ((b1 >= 0x81 && b1 <= 0x9F) || (b1 >= 0xE0 && b1 <= 0xFC)) {
      const b2 = data[i + 1];
      if ((b2 >= 0x40 && b2 <= 0x7E) || (b2 >= 0x80 && b2 <= 0xFC)) {
        score += 2;
        i++;
      }
    }
  }
  return Math.min(score / Math.max(data.length / 10, 1), 0.7);
}

function detectWin1252(data: Uint8Array): number {
  let score = 0;
  for (const b of data) {
    if (b >= 0x80 && b <= 0x9F) score += 1;
  }
  return Math.min(score / Math.max(data.length / 20, 1), 0.5);
}

export function detectEncoding(data: Uint8Array): EncodingResult {
  const results = ENCODINGS.map(({ name, detector }) => ({
    encoding: name,
    confidence: detector(data),
  }));

  results.sort((a, b) => b.confidence - a.confidence);

  const best = results[0];
  const alternatives = results.slice(1, 4);

  let convertedText = "";
  try {
    convertedText = new TextDecoder(best.encoding, { fatal: false }).decode(data);
  } catch {
    convertedText = new TextDecoder("utf-8", { fatal: false }).decode(data);
  }

  const mojibake = detectMojibake(convertedText);
  let mojibakeRepair: EncodingResult["mojibakeRepair"] | undefined;

  if (mojibake.detected) {
    const repaired = repairMojibake(convertedText, best.encoding);
    if (repaired.repaired !== convertedText) {
      mojibakeRepair = {
        original: convertedText.slice(0, 200),
        repaired: repaired.repaired.slice(0, 200),
        explanation: repaired.explanation,
      };
    }
  }

  return {
    encoding: best.encoding,
    confidence: best.confidence,
    alternativeEncodings: alternatives,
    convertedText,
    mojibakeDetected: mojibake.detected,
    mojibakeRepair,
  };
}

function detectMojibake(text: string): { detected: boolean; pattern: string } {
  const patterns = [
    { pattern: "â€™", name: "UTF-8 read as Latin-1" },
    { pattern: "â€œ", name: "UTF-8 read as Latin-1" },
    { pattern: "â€", name: "UTF-8 read as Latin-1" },
    { pattern: "Ã©", name: "UTF-8 read as Latin-1" },
    { pattern: "Ã¼", name: "UTF-8 read as Latin-1" },
    { pattern: "Ã¶", name: "UTF-8 read as Latin-1" },
    { pattern: "Ã¤", name: "UTF-8 read as Latin-1" },
    { pattern: "ÃŸ", name: "UTF-8 read as Latin-1" },
    { pattern: "Â£", name: "UTF-8 read as Latin-1" },
    { pattern: "Â©", name: "UTF-8 read as Latin-1" },
    { pattern: "Â®", name: "UTF-8 read as Latin-1" },
  ];

  for (const p of patterns) {
    if (text.includes(p.pattern)) {
      return { detected: true, pattern: p.name };
    }
  }
  return { detected: false, pattern: "" };
}

function repairMojibake(text: string, sourceEncoding: string): { repaired: string; explanation: string } {
  if (sourceEncoding === "iso-8859-1" || sourceEncoding === "windows-1252") {
    try {
      const bytes = new TextEncoder().encode(text);
      const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (repaired !== text && !detectMojibake(repaired).detected) {
        return { repaired, explanation: `Likely UTF-8 bytes misread as ${sourceEncoding}. Re-interpreted as UTF-8.` };
      }
    } catch {
      // fallback
    }
  }

  return { repaired: text, explanation: "No automatic repair available" };
}

export function convertToUtf8(data: Uint8Array, sourceEncoding: string): string {
  try {
    return new TextDecoder(sourceEncoding, { fatal: false }).decode(data);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(data);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface TestResult {
  passed: boolean;
  message: string;
}
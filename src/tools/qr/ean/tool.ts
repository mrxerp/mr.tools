const L: Record<string, string> = {
  "0": "0001101", "1": "0011001", "2": "0010011", "3": "0111101", "4": "0100011",
  "5": "0110001", "6": "0101111", "7": "0111011", "8": "0110111", "9": "0001011",
};
const G: Record<string, string> = {
  "0": "0100111", "1": "0110011", "2": "0011011", "3": "0100001", "4": "0011101",
  "5": "0111001", "6": "0000101", "7": "0010001", "8": "0001001", "9": "0010111",
};
const R: Record<string, string> = {
  "0": "1110010", "1": "1100110", "2": "1101100", "3": "1000010", "4": "1011100",
  "5": "1001110", "6": "1010000", "7": "1000100", "8": "1001000", "9": "1110100",
};
const PARITY: Record<string, string> = {
  "0": "LLLLLL", "1": "LLGLGG", "2": "LLGGLG", "3": "LLGGGL", "4": "LGLLGG",
  "5": "LGGLLG", "6": "LGGGLL", "7": "LGLGLG", "8": "LGLGGL", "9": "LGGLGL",
};

function bits(s: string): number[] {
  return s.split("").map((c) => (c === "1" ? 1 : 0));
}

export function normalizeEan13(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

export function ean13CheckDigit(digits: string): number {
  const d = normalizeEan13(digits).slice(0, 12);
  if (d.length !== 12) throw new Error("EAN-13 needs 12 data digits");
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = d.charCodeAt(i) - 48;
    sum += (i % 2 === 0 ? 1 : 3) * n;
  }
  return (10 - (sum % 10)) % 10;
}

export function completeEan13(input: string): string {
  const d = normalizeEan13(input);
  if (d.length === 13) return d;
  if (d.length === 12) return d + ean13CheckDigit(d);
  return "";
}

export function validateEan13(code: string): boolean {
  const d = normalizeEan13(code);
  if (d.length !== 13) return false;
  return ean13CheckDigit(d.slice(0, 12)) === Number(d[12]);
}

export function ean13Modules(code: string): number[] {
  const d = normalizeEan13(code);
  if (!validateEan13(d)) return [];
  const first = d[0];
  const out: number[] = bits("101");
  for (let i = 1; i <= 6; i++) {
    const table = PARITY[first][i - 1] === "L" ? L : G;
    out.push(...bits(table[d[i]]));
  }
  out.push(...bits("01010"));
  for (let i = 7; i <= 12; i++) out.push(...bits(R[d[i]]));
  out.push(...bits("101"));
  return out;
}

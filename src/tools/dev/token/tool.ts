export const CHAR_SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+",
} as const;

export type CharsetOptions = {
  lower?: boolean;
  upper?: boolean;
  digits?: boolean;
  symbols?: boolean;
};

export function resolveCharset(charset: CharsetOptions): string {
  let out = "";
  if (charset.lower) out += CHAR_SETS.lower;
  if (charset.upper) out += CHAR_SETS.upper;
  if (charset.digits) out += CHAR_SETS.digits;
  if (charset.symbols) out += CHAR_SETS.symbols;
  return out;
}

function randomIndex(poolSize: number): number {
  const limit = Math.floor(256 / poolSize) * poolSize;
  const buf = new Uint8Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % poolSize;
}

export function generateTokens(
  length: number,
  charset: CharsetOptions,
  count: number,
): string[] {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("length must be a positive integer");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("count must be a positive integer");
  }
  const pool = resolveCharset(charset);
  if (pool.length === 0) {
    throw new Error("select at least one character set");
  }
  const tokens: string[] = [];
  for (let i = 0; i < count; i++) {
    let token = "";
    for (let j = 0; j < length; j++) {
      token += pool[randomIndex(pool.length)];
    }
    tokens.push(token);
  }
  return tokens;
}

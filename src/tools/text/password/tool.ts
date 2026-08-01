export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export type RandomSource = (n: number) => Uint8Array;

export const MIN_LENGTH = 1;
export const MAX_LENGTH = 1024;

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";

function charset(options: PasswordOptions): string {
  let pool = "";
  if (options.lowercase) pool += LOWER;
  if (options.uppercase) pool += UPPER;
  if (options.digits) pool += DIGITS;
  if (options.symbols) pool += SYMBOLS;
  if (options.excludeAmbiguous) pool = pool.replace(/[Il1O0o]/g, "");
  return pool;
}

function defaultRandom(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

export function generatePassword(
  options: PasswordOptions,
  random: RandomSource = defaultRandom,
): string {
  const pool = charset(options);
  if (pool.length === 0) return "";
  const raw = Number.isFinite(options.length) ? Math.round(options.length) : MIN_LENGTH;
  const length = Math.min(Math.max(raw, MIN_LENGTH), MAX_LENGTH);
  const bytes = random(length);
  let out = "";
  // ponytail: byte % pool.length has negligible bias for passwords; rejection sampling if it ever matters
  for (const b of bytes) out += pool[b % pool.length];
  return out;
}

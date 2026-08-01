import { ok, strictEqual } from "node:assert";
import {
  generatePassword,
  MAX_LENGTH,
  type PasswordOptions,
  type RandomSource,
} from "./tool.ts";

function seeded(): RandomSource {
  let s = 123456789;
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out[i] = s & 0xff;
    }
    return out;
  };
}

const ALLOWED =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>?";

const all: PasswordOptions = {
  length: 32,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
};

export async function runTest() {
  const random = seeded();
  let combined = "";
  for (let i = 0; i < 8; i++) {
    const pw = generatePassword(all, random);
    strictEqual(pw.length, 32, "exact requested length");
    for (const c of pw) ok(ALLOWED.includes(c), `char "${c}" outside charset`);
    combined += pw;
  }
  ok(/[a-z]/.test(combined), "lowercase present");
  ok(/[A-Z]/.test(combined), "uppercase present");
  ok(/[0-9]/.test(combined), "digits present");
  ok(/[^a-zA-Z0-9]/.test(combined), "symbols present");

  let noAmb = "";
  for (let i = 0; i < 8; i++) {
    noAmb += generatePassword({ ...all, excludeAmbiguous: true }, seeded());
  }
  ok(!/[Il1O0o]/.test(noAmb), "ambiguous chars excluded");

  strictEqual(
    generatePassword({
      length: 16,
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
      excludeAmbiguous: false,
    }),
    "",
    "all options off yields empty password",
  );

  strictEqual(generatePassword({ ...all, length: 1e6 }, seeded()).length, MAX_LENGTH);
  strictEqual(generatePassword({ ...all, length: -5 }, seeded()).length, 1);
  strictEqual(generatePassword({ ...all, length: Number.NaN }, seeded()).length, 1);
}

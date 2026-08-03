const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function digitsForBase(base: number): string {
  return DIGITS.slice(0, base);
}

export function convertBase(
  value: string,
  fromBase: number,
  toBase: number,
): string {
  if (!Number.isInteger(fromBase) || fromBase < 2 || fromBase > 36) {
    throw new Error("From base must be an integer between 2 and 36");
  }
  if (!Number.isInteger(toBase) || toBase < 2 || toBase > 36) {
    throw new Error("To base must be an integer between 2 and 36");
  }
  const clean = value.trim().toLowerCase();
  if (!clean) throw new Error("Value is empty");

  let big = 0n;
  for (const ch of clean) {
    const digit = DIGITS.indexOf(ch);
    if (digit === -1 || digit >= fromBase) {
      throw new Error(`Invalid digit "${ch}" for base ${fromBase}`);
    }
    big = big * BigInt(fromBase) + BigInt(digit);
  }

  if (big === 0n) return "0";
  const target = BigInt(toBase);
  let out = "";
  while (big > 0n) {
    out = DIGITS[Number(big % target)] + out;
    big /= target;
  }
  return out;
}

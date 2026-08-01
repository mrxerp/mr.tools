import { deepStrictEqual, strictEqual } from "node:assert";
import { completeEan13, ean13CheckDigit, ean13Modules, normalizeEan13, validateEan13 } from "./tool.ts";

function toBits(s: string): number[] {
  return s.split("").map((c) => (c === "1" ? 1 : 0));
}

export async function runTest() {
  strictEqual(normalizeEan13("590123412345 7"), "5901234123457");
  strictEqual(normalizeEan13("ab12"), "12");

  strictEqual(ean13CheckDigit("590123412345"), 7);
  strictEqual(ean13CheckDigit("400638133393"), 1);
  strictEqual(ean13CheckDigit("000000000000"), 0);
  strictEqual(ean13CheckDigit("4006381333931"), 1);

  strictEqual(completeEan13("590123412345"), "5901234123457");
  strictEqual(completeEan13("400638133393"), "4006381333931");
  strictEqual(completeEan13("5901234123457"), "5901234123457");
  strictEqual(completeEan13("123"), "");

  strictEqual(validateEan13("5901234123457"), true);
  strictEqual(validateEan13("5901234123458"), false);
  strictEqual(validateEan13("4006381333931"), true);
  strictEqual(validateEan13("123"), false);

  const expected = [
    ...toBits("101"),
    ...toBits("0001101".repeat(6)),
    ...toBits("01010"),
    ...toBits("1110010".repeat(6)),
    ...toBits("101"),
  ];
  deepStrictEqual(ean13Modules("0000000000000"), expected);

  const one = [
    ...toBits("101"),
    ...toBits("0001101" + "0011001" + "0011011" + "0111101" + "0011101" + "0111001"),
    ...toBits("01010"),
    ...toBits("1010000" + "1000100" + "1001000" + "1110100" + "1110010" + "1011100"),
    ...toBits("101"),
  ];
  deepStrictEqual(ean13Modules("1012345678904"), one);
  deepStrictEqual(ean13Modules("123"), []);
}

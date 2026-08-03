import { strictEqual, throws } from "node:assert";
import { convertBase, digitsForBase } from "./tool.ts";

export async function runTest() {
  strictEqual(convertBase("255", 10, 16), "ff", "decimal to hex");
  strictEqual(convertBase("255", 10, 2), "11111111", "decimal to binary");
  strictEqual(convertBase("ff", 16, 10), "255", "hex to decimal");
  strictEqual(convertBase("777", 8, 10), "511", "octal to decimal");
  strictEqual(
    convertBase("12345678901234567890", 10, 16),
    "ab54a98ceb1f0ad2",
    "big integer to hex",
  );
  strictEqual(convertBase("1010", 2, 10), "10", "binary to decimal");
  strictEqual(convertBase("FF", 16, 10), "255", "input is case-insensitive");
  strictEqual(convertBase("0", 10, 16), "0", "zero stays zero");
  strictEqual(convertBase("z", 36, 10), "35", "highest digit works");

  throws(() => convertBase("2", 2, 10), /Invalid digit/, "digit out of range throws");
  throws(() => convertBase("g", 16, 10), /Invalid digit/, "non-digit throws");
  throws(() => convertBase("1", 1, 10), /2 and 36/, "from base 1 throws");
  throws(() => convertBase("1", 10, 37), /2 and 36/, "to base 37 throws");
  throws(() => convertBase("", 10, 16), /empty/i, "empty value throws");

  strictEqual(digitsForBase(2), "01", "binary digits");
  strictEqual(digitsForBase(16), "0123456789abcdef", "hex digits");
}

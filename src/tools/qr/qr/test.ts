import { deepStrictEqual, strictEqual } from "node:assert";
import { MAX_TEXT_LENGTH, normalizeQrOptions, normalizeQrText } from "./tool.ts";

export async function runTest() {
  strictEqual(normalizeQrText("  hello  "), "hello");
  strictEqual(normalizeQrText("   "), "");
  strictEqual(normalizeQrText(""), "");
  strictEqual(normalizeQrText("x".repeat(5000)).length, MAX_TEXT_LENGTH);

  deepStrictEqual(normalizeQrOptions(), { width: 256, margin: 4, errorCorrectionLevel: "M" });
  deepStrictEqual(normalizeQrOptions({ width: 300.5 }), {
    width: 301,
    margin: 4,
    errorCorrectionLevel: "M",
  });
  deepStrictEqual(normalizeQrOptions({ width: 10 }), {
    width: 96,
    margin: 4,
    errorCorrectionLevel: "M",
  });
  deepStrictEqual(normalizeQrOptions({ width: 99999 }), {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
  });
  deepStrictEqual(normalizeQrOptions({ margin: -3 }), {
    width: 256,
    margin: 0,
    errorCorrectionLevel: "M",
  });
  deepStrictEqual(normalizeQrOptions({ margin: 3.8 }), {
    width: 256,
    margin: 4,
    errorCorrectionLevel: "M",
  });
  deepStrictEqual(normalizeQrOptions({ errorCorrectionLevel: "H" }), {
    width: 256,
    margin: 4,
    errorCorrectionLevel: "H",
  });
  deepStrictEqual(normalizeQrOptions({ errorCorrectionLevel: "low" }), {
    width: 256,
    margin: 4,
    errorCorrectionLevel: "M",
  });
}

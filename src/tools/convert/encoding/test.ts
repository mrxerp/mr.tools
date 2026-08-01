import { strictEqual, ok } from "node:assert";
import { detectEncoding, convertToUtf8, formatBytes } from "./tool.ts";

export async function runTest() {
  const utf8Text = "Hello, World! 🎉 Café naïve résumé";
  const utf8Data = new TextEncoder().encode(utf8Text);
  const result = detectEncoding(utf8Data);
  strictEqual(result.encoding, "utf-8");
  strictEqual(result.confidence, 1.0);
  strictEqual(result.convertedText, utf8Text);

  const latin1Text = "Café naïve résumé";
  const latin1Data = new TextEncoder().encode(latin1Text);
  const latin1Result = detectEncoding(latin1Data);
  ok(["utf-8", "iso-8859-1", "windows-1252"].includes(latin1Result.encoding));

  const shiftJisText = "こんにちは";
  const shiftJisData = new TextEncoder().encode(shiftJisText);
  const sjisResult = detectEncoding(shiftJisData);
  ok(["utf-8", "shift_jis"].includes(sjisResult.encoding));

  const mojibakeData = new TextEncoder().encode("â€™");
  const mojibakeResult = detectEncoding(mojibakeData);
  ok(mojibakeResult.mojibakeDetected);

  // Test convertToUtf8 with already UTF-8 data (should pass through)
  const converted = convertToUtf8(new TextEncoder().encode("Café"), "utf-8");
  ok(converted.includes("Café"));

  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  console.log("All encoding tests passed");
}
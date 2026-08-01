import { strictEqual } from "node:assert";
import { classifyScan } from "./tool.ts";

export async function runTest() {
  strictEqual(classifyScan("https://example.com"), "URL");
  strictEqual(classifyScan("http://a.b/c"), "URL");
  strictEqual(classifyScan("mailto:a@b.com"), "Email");
  strictEqual(classifyScan("tel:+15551234567"), "Phone");
  strictEqual(classifyScan("WIFI:S:net;T:WPA;P:p;;"), "Wi-Fi");
  strictEqual(classifyScan("BEGIN:VCARD\r\nVERSION:3.0\r\nEND:VCARD"), "Contact (vCard)");
  strictEqual(classifyScan("geo:51.5,-0.12"), "Map location");
  strictEqual(classifyScan("5901234123457"), "Numeric code");
  strictEqual(classifyScan("12345"), "Text");
  strictEqual(classifyScan("hello world"), "Text");
  strictEqual(classifyScan(""), "Empty");
  strictEqual(classifyScan("   "), "Empty");
}

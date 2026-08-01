import { deepStrictEqual, strictEqual } from "node:assert";
import { charMap, cleanText, detectInvisible } from "./tool.ts";

export async function runTest() {
  const space = detectInvisible("a b");
  strictEqual(space.length, 1);
  strictEqual(space[0].kind, "space");
  strictEqual(space[0].index, 1);

  strictEqual(detectInvisible("a\u00a0b")[0].kind, "nbsp");
  strictEqual(detectInvisible("a\u200bb")[0].kind, "zero-width");
  strictEqual(detectInvisible("a\tb")[0].kind, "tab");
  strictEqual(detectInvisible("a\nb")[0].kind, "newline");
  strictEqual(detectInvisible("a\ufeffb")[0].kind, "bom");
  strictEqual(detectInvisible("plain").length, 0, "no invisibles");

  strictEqual(detectInvisible("a\u200bb")[0].code, "U+200B");
  strictEqual(detectInvisible("a\u00a0b")[0].name, "No-break space");

  const map = charMap("a b");
  strictEqual(map.length, 3);
  deepStrictEqual(map.map((c) => c.kind), ["visible", "space", "visible"]);

  strictEqual(cleanText("a\u00a0b\u200b\u200cc"), "a bc", "nbsp to space, zero-width removed");
  strictEqual(cleanText("x\ufeffx"), "xx", "BOM removed");
  strictEqual(cleanText("a\r\nb"), "a\nb", "CRLF normalized");
  strictEqual(cleanText("plain"), "plain", "clean text unchanged");
}

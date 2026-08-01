import { strictEqual } from "node:assert";
import {
  encodeBase64,
  decodeBase64,
  encodeUrl,
  decodeUrl,
  encodeHtmlEntities,
  decodeHtmlEntities,
  encodeUnicodeEscapes,
  decodeUnicodeEscapes,
  decodeJwtPayload,
  encodeAll,
  decodeAll,
} from "./tool.ts";

export async function runTest() {
  const text = "Hello, World! 🌍";

  // Base64
  const b64 = encodeBase64(text);
  strictEqual(decodeBase64(b64), text, "Base64 roundtrip");

  // URL
  const url = encodeUrl(text);
  strictEqual(decodeUrl(url), text, "URL roundtrip");

  // HTML Entities
  const html = encodeHtmlEntities("<script>alert('xss')</script>");
  strictEqual(html, "<script>alert('xss')</script>", "HTML entities encode");
  strictEqual(decodeHtmlEntities(html), "<script>alert('xss')</script>", "HTML entities decode");

  // Unicode Escapes
  const unicode = encodeUnicodeEscapes("café");
  strictEqual(unicode, "caf\\u00e9", "Unicode escapes encode");
  strictEqual(decodeUnicodeEscapes(unicode), "café", "Unicode escapes decode");

  // JWT Payload
  const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const payload = decodeJwtPayload(jwt);
  strictEqual(payload.includes("1234567890"), true, "JWT payload decode");

  // encodeAll
  const allEncoded = encodeAll("test");
  strictEqual(allEncoded.length, 5, "encodeAll returns 5 results");
  strictEqual(allEncoded.find((e) => e.type === "Base64")?.value, "dGVzdA==", "Base64 in encodeAll");

  // decodeAll
  const allDecoded = decodeAll("dGVzdA==");
  strictEqual(allDecoded.length, 6, "decodeAll returns 6 results (including JWT)");
  strictEqual(allDecoded.find((e) => e.type === "Base64")?.value, "test", "Base64 in decodeAll");

  // Empty input
  strictEqual(encodeAll("").length, 0, "encodeAll empty input");
  strictEqual(decodeAll("").length, 0, "decodeAll empty input");

  // Invalid JWT
  const invalidJwt = decodeAll("not.a.valid.jwt");
  const jwtResult = invalidJwt.find((e) => e.type === "JWT Payload");
  strictEqual(jwtResult?.value, "[Invalid JWT token]", "Invalid JWT handled");

  // Invalid Base64
  const invalidB64 = decodeAll("not valid base64!");
  const b64Result = invalidB64.find((e) => e.type === "Base64");
  strictEqual(b64Result?.value, "[Invalid Base64]", "Invalid Base64 handled");
}
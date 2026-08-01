import { ok, strictEqual } from "node:assert";
import { normalizeFormat, canEncode, clampQuality } from "./tool.ts";

export async function runTest() {
  strictEqual(normalizeFormat("png"), "png");
  strictEqual(normalizeFormat("jpeg"), "jpeg");
  strictEqual(normalizeFormat("jpg"), "jpeg", "jpg maps to jpeg");
  strictEqual(normalizeFormat("webp"), "webp");
  strictEqual(normalizeFormat("WEBP"), "webp", "case-insensitive");
  strictEqual(normalizeFormat("  png  "), "png", "whitespace trimmed");
  strictEqual(normalizeFormat("image/jpeg"), "jpeg", "mime prefix stripped");
  strictEqual(normalizeFormat("image/png"), "png");
  strictEqual(normalizeFormat("gif"), "png", "unknown falls back to png");
  strictEqual(normalizeFormat(""), "png");
  strictEqual(normalizeFormat("jPg"), "jpeg");

  strictEqual(clampQuality(1), 1);
  strictEqual(clampQuality(0), 0);
  strictEqual(clampQuality(0.5), 0.5);
  strictEqual(clampQuality(1.5), 1, "over 1 clamps to 1");
  strictEqual(clampQuality(-0.5), 0, "below 0 clamps to 0");
  strictEqual(clampQuality(NaN), 0.92, "NaN falls back to default");
  strictEqual(clampQuality(Infinity), 0.92, "Infinity falls back to default");

  ok(typeof canEncode("png") === "boolean");
  ok(typeof canEncode("jpeg") === "boolean");
  ok(typeof canEncode("webp") === "boolean");
  strictEqual(canEncode("png"), false, "no DOM in Node -> unsupported");
}

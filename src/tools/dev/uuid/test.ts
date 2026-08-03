import { strictEqual, ok } from "node:assert";
import { generateUuid } from "./tool.ts";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V4_UPPER = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function runTest() {
  for (let i = 0; i < 20; i++) {
    const v4 = generateUuid(4);
    ok(V4.test(v4), `v4 shape: ${v4}`);
    strictEqual(v4[14], "4", "v4 version nibble");
  }

  const before = Date.now();
  const v7 = generateUuid(7);
  const after = Date.now();
  const ts = parseInt(v7.replace(/-/g, "").slice(0, 12), 16);
  ok(V7.test(v7), `v7 shape: ${v7}`);
  strictEqual(v7[14], "7", "v7 version nibble");
  ok(ts >= before && ts <= after, "v7 embeds current ms timestamp");

  const upper = generateUuid(4, true);
  ok(V4_UPPER.test(upper), `uppercase shape: ${upper}`);
  const lower = generateUuid(4, false);
  ok(/[a-f]/.test(lower), "default output is lowercase");

  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) seen.add(generateUuid(4));
  strictEqual(seen.size, 100, "100 generated v4s are unique");
}

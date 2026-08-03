import { strictEqual, ok } from "node:assert";
import {
  randomPort,
  classifyPort,
  RANGES,
  COMMON_CONFLICTS,
} from "./tool.ts";

export async function runTest() {
  strictEqual(classifyPort(80), "well-known", "80 is well-known");
  strictEqual(classifyPort(1024), "registered", "1024 is registered");
  strictEqual(classifyPort(49151), "registered", "49151 is registered");
  strictEqual(classifyPort(49152), "dynamic", "49152 is dynamic");
  strictEqual(classifyPort(65535), "dynamic", "65535 is dynamic");

  for (let i = 0; i < 200; i++) {
    const p = randomPort(49152, 65535);
    ok(p >= 49152 && p <= 65535, "dynamic port within bounds");
  }
  strictEqual(randomPort(0, 0), 0, "single-value range");
  strictEqual(RANGES["well-known"][0], 0, "well-known min");
  strictEqual(RANGES.registered[1], 49151, "registered max");
  strictEqual(RANGES.dynamic[1], 65535, "dynamic max");
  ok(COMMON_CONFLICTS.includes(80), "conflict list includes 80");
  ok(COMMON_CONFLICTS.length === 14, "conflict list has 14 entries");
}

import { strictEqual } from "node:assert";
import { transform } from "./tool.ts";

export async function runTest() {
  strictEqual(transform("x"), "x", "transform passthrough");
}

import { strictEqual, deepStrictEqual } from "node:assert";
import {
  parseInput,
  diff,
  formatDiffResult,
  deepEqual,
  collectPaths,
  getValueAtPath,
} from "./tool.ts";

export async function runTest() {
  // parseInput JSON
  const jsonResult = parseInput('{"a":1,"b":2}', "json");
  strictEqual(jsonResult.error, undefined);
  deepStrictEqual(jsonResult.data, { a: 1, b: 2 });

  // parseInput invalid JSON
  const badJson = parseInput('{', "json");
  strictEqual(typeof badJson.error, "string");

  // parseInput YAML (simple)
  const yamlResult = parseInput("a: 1\nb: 2", "yaml");
  strictEqual(yamlResult.error, undefined);

  // diff structural - same objects different key order
  const left = { a: 1, b: 2 };
  const right = { b: 2, a: 1 };
  const structural = diff(left, right, "structural");
  strictEqual(structural.same, true);

  // diff literal - same objects different key order
  const literal = diff(left, right, "literal");
  strictEqual(literal.same, true); // literal mode compares values, not key order in JS objects

  // diff with actual differences
  const left2 = { a: 1, b: 2 };
  const right2 = { a: 1, b: 3 };
  const d1 = diff(left2, right2, "structural");
  strictEqual(d1.same, false);
  strictEqual(d1.differences.length, 1);
  strictEqual(d1.differences[0].path, "b");
  strictEqual(d1.differences[0].type, "changed");

  // diff added/removed
  const left3 = { a: 1 };
  const right3 = { a: 1, b: 2 };
  const d2 = diff(left3, right3, "structural");
  strictEqual(d2.same, false);
  const added = d2.differences.find((d) => d.type === "added");
  strictEqual(added?.path, "b");

  const d3 = diff(right3, left3, "structural");
  const removed = d3.differences.find((d) => d.type === "removed");
  strictEqual(removed?.path, "b");

  // diff nested
  const left4 = { a: { x: 1 } };
  const right4 = { a: { x: 2 } };
  const d4 = diff(left4, right4, "structural");
  strictEqual(d4.differences[0].path, "a.x");

  // diff arrays
  const left5 = { items: [1, 2] };
  const right5 = { items: [1, 3] };
  const d5 = diff(left5, right5, "structural");
  strictEqual(d5.differences[0].path, "items[1]");

  // deepEqual
  strictEqual(deepEqual({ a: 1 }, { a: 1 }), true);
  strictEqual(deepEqual({ a: 1 }, { a: 2 }), false);
  strictEqual(deepEqual([1, 2], [1, 2]), true);
  strictEqual(deepEqual([1, 2], [2, 1]), false);
  strictEqual(deepEqual({ a: { b: 1 } }, { a: { b: 1 } }), true);

  // collectPaths
  const paths = new Set<string>();
  collectPaths({ a: { b: 1 }, c: [2, 3] }, "", paths);
  strictEqual(paths.has("a"), true);
  strictEqual(paths.has("a.b"), true);
  strictEqual(paths.has("c"), true);
  strictEqual(paths.has("c[0]"), true);
  strictEqual(paths.has("c[1]"), true);

  // getValueAtPath
  strictEqual(getValueAtPath({ a: { b: 1 } }, "a.b"), 1);
  strictEqual(getValueAtPath({ a: [1, 2] }, "a[1]"), 2);
  strictEqual(getValueAtPath({ a: 1 }, "b"), undefined);

  // formatDiffResult
  const fmt = formatDiffResult(d1);
  strictEqual(fmt.includes("Differences: 1"), true);
  strictEqual(fmt.includes("b: changed"), true);
}
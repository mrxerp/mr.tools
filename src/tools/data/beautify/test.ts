import { strictEqual, deepStrictEqual } from "node:assert";
import { beautifyJson, validateJson, minifyJson, sortObjectKeys } from "./tool.ts";

export async function runTest() {
  // Basic formatting
  const r1 = beautifyJson('{"b":2,"a":1}');
  strictEqual(r1.valid, true);
  strictEqual(r1.output.includes("a"), true);
  strictEqual(r1.output.includes("b"), true);

  // Minify
  const r2 = beautifyJson('{"a": 1, "b": 2}', { minify: true });
  strictEqual(r2.valid, true);
  strictEqual(r2.output, '{"a":1,"b":2}');

  // Sort keys
  const r3 = beautifyJson('{"b":2,"a":1}', { sortKeys: true });
  strictEqual(r3.valid, true);
  const idxA = r3.output.indexOf('"a"');
  const idxB = r3.output.indexOf('"b"');
  strictEqual(idxA < idxB, true, "keys should be sorted");

  // Indent options
  const r4 = beautifyJson('{"a":1}', { indent: 4 });
  strictEqual(r4.output.includes("    "), true);

  // Tab indent
  const r5 = beautifyJson('{"a":1}', { indent: "\t" });
  strictEqual(r5.output.includes("\t"), true);

  // Invalid JSON
  const r6 = beautifyJson('{"a":}');
  strictEqual(r6.valid, false);
  strictEqual(typeof r6.error?.line, "number", "line should be a number");
  strictEqual(typeof r6.error?.column, "number", "column should be a number");

  // Empty input
  const r7 = beautifyJson("");
  strictEqual(r7.valid, true);
  strictEqual(r7.output, "");

  // validateJson
  const v1 = validateJson('{"a":1}');
  strictEqual(v1.valid, true);
  const v2 = validateJson('{');
  strictEqual(v2.valid, false);

  // minifyJson
  const m1 = minifyJson('{"a": 1, "b": 2}');
  strictEqual(m1.output, '{"a":1,"b":2}');

  // sortObjectKeys
  const sorted = sortObjectKeys({ b: 2, a: { d: 4, c: 3 } });
  deepStrictEqual(Object.keys(sorted as object), ["a", "b"]);
  deepStrictEqual(Object.keys((sorted as Record<string, unknown>).a as object), ["c", "d"]);

  // Array sorting
  const sortedArr = sortObjectKeys([{ b: 2, a: 1 }, { d: 4, c: 3 }]);
  deepStrictEqual(Object.keys((sortedArr as unknown[])[0] as object), ["a", "b"]);
}
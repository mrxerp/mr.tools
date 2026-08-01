import { strictEqual, deepStrictEqual } from "node:assert";
import {
  parseYaml,
  stringifyYaml,
  convertJsonToYaml,
  convertYamlToJson,
  lintYaml,
  checkYamlQuoting,
} from "./tool.ts";

export async function runTest() {
  // parseYaml basic
  const r1 = parseYaml("a: 1\nb: 2");
  strictEqual(r1.valid, true);
  deepStrictEqual(r1.data, { a: 1, b: 2 });

  // parseYaml nested
  const r2 = parseYaml("a:\n  b: 1\n  c: 2");
  strictEqual(r2.valid, true);
  deepStrictEqual(r2.data, { a: { b: 1, c: 2 } });

  // parseYaml array
  const r3 = parseYaml("items:\n  - 1\n  - 2\n  - 3");
  strictEqual(r3.valid, true);
  deepStrictEqual(r3.data, { items: [1, 2, 3] });

  // parseYaml types
  const r4 = parseYaml("bool: true\nint: 42\nfloat: 3.14\nnull: null\nstr: hello");
  strictEqual(r4.valid, true);
  strictEqual((r4.data as Record<string, unknown>).bool, true);
  strictEqual((r4.data as Record<string, unknown>).int, 42);
  strictEqual((r4.data as Record<string, unknown>).float, 3.14);
  strictEqual((r4.data as Record<string, unknown>).null, null);
  strictEqual((r4.data as Record<string, unknown>).str, "hello");

  // parseYaml quoted strings
  const r5 = parseYaml('str: "hello: world"\nstr2: \'single quotes\'');
  strictEqual(r5.valid, true);
  strictEqual((r5.data as Record<string, unknown>).str, "hello: world");
  strictEqual((r5.data as Record<string, unknown>).str2, "single quotes");

  // parseYaml error
  const r6 = parseYaml("a: 1\n  b: 2"); // bad indent
  strictEqual(r6.valid, false);
  strictEqual(typeof r6.error?.line, "number");

  // stringifyYaml
  const yaml1 = stringifyYaml({ a: 1, b: { c: 2 } });
  strictEqual(yaml1.includes("a: 1"), true);
  strictEqual(yaml1.includes("b:"), true);
  strictEqual(yaml1.includes("c: 2"), true);

  // stringifyYaml array
  const yaml2 = stringifyYaml({ items: [1, 2, 3] });
  strictEqual(yaml2.includes("- 1"), true);

  // stringifyYaml quoting
  const yaml3 = stringifyYaml({ "special:key": "value" });
  strictEqual(yaml3.includes('"special:key"'), true);

  // convertJsonToYaml
  const c1 = convertJsonToYaml('{"a":1,"b":2}');
  strictEqual(c1.valid, true);
  strictEqual(c1.yaml?.includes("a: 1"), true);

  // convertYamlToJson
  const c2 = convertYamlToJson("a: 1\nb: 2");
  strictEqual(c2.valid, true);
  strictEqual(c2.json?.includes("1"), true);

  // lintYaml
  const l1 = lintYaml("a: 1");
  strictEqual(l1.valid, true);
  const l2 = lintYaml("a: [");
  strictEqual(l2.valid, false);

  // checkYamlQuoting warnings
  const warns1 = checkYamlQuoting("time: 10:30\nbool: yes");
  strictEqual(warns1.length, 2);

  const warns2 = checkYamlQuoting('time: "10:30"\nbool: "yes"');
  strictEqual(warns2.length, 0);
}
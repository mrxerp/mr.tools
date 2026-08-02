import { strictEqual, deepStrictEqual } from "node:assert";
import {
  jsonToCsv,
  csvToJson,
  flattenObject,
  unflattenObject,
  parseCsvLine,
  escapeCsv,
  detectDelimiter,
} from "./tool.ts";

export async function runTest() {
  // jsonToCsv basic
  const r1 = jsonToCsv('[{"a":1,"b":2},{"a":3,"b":4}]');
  strictEqual(r1.error, undefined);
  strictEqual(r1.headers.length, 2);
  strictEqual(r1.rows.length, 2);
  strictEqual(r1.csv.includes("a,b"), true);

  // jsonToCsv nested with flatten
  const r2 = jsonToCsv('[{"a":{"b":1}}]');
  strictEqual(r2.headers.includes("a.b"), true);
  strictEqual(r2.rows[0][0], 1);

  // jsonToCsv array flattening
  const r3 = jsonToCsv('[{"items":[1,2,3]}]');
  strictEqual(r3.headers.includes("items.0"), true);
  strictEqual(r3.headers.includes("items.1"), true);
  strictEqual(r3.headers.includes("items.2"), true);

  // jsonToCsv null handling
  const r4 = jsonToCsv('[{"a":1,"b":null}]', { handleNulls: "null" });
  strictEqual(r4.csv.includes("null"), true);
  const r5 = jsonToCsv('[{"a":1,"b":null}]', { handleNulls: "empty" });
  strictEqual(r5.csv.endsWith(",\n") || r5.csv.endsWith(","), true);

  // jsonToCsv no header
  const r6 = jsonToCsv('[{"a":1}]', { includeHeader: false });
  strictEqual(!r6.csv.includes("a"), true);

  // jsonToCsv error on non-array
  const r7 = jsonToCsv('{"a":1}');
  strictEqual(typeof r7.error, "string");

  // csvToJson basic
  const c1 = csvToJson("a,b\n1,2\n3,4");
  strictEqual(c1.error, undefined);
  strictEqual(c1.data.length, 2);
  deepStrictEqual(c1.data[0], { a: 1, b: 2 });

  // csvToJson with flatten
  const c2 = csvToJson("a.b,a.c\n1,2", { flatten: true });
  strictEqual((c2.data[0] as { a: Record<string, unknown> }).a.b, 1);
  strictEqual((c2.data[0] as { a: Record<string, unknown> }).a.c, 2);

  // parseCsvLine
  deepStrictEqual(parseCsvLine('a,b,c'), ["a", "b", "c"]);
  deepStrictEqual(parseCsvLine('"a,b",c'), ["a,b", "c"]);
  deepStrictEqual(parseCsvLine('"a""b",c'), ['a"b', "c"]);

  // escapeCsv
  strictEqual(escapeCsv("hello"), "hello");
  strictEqual(escapeCsv('hello,world'), '"hello,world"');
  strictEqual(escapeCsv('hello"world'), '"hello""world"');
  strictEqual(escapeCsv("hello\nworld"), '"hello\nworld"');

  // detectDelimiter
  strictEqual(detectDelimiter("a,b,c\n1,2,3"), ",");
  strictEqual(detectDelimiter("a;b;c\n1;2;3"), ";");
  strictEqual(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");

  // flattenObject
  const flat = flattenObject({ a: { b: 1, c: [2, 3] } }, ".");
  strictEqual(flat["a.b"], 1);
  strictEqual(flat["a.c.0"], 2);
  strictEqual(flat["a.c.1"], 3);

  // unflattenObject
  const unflat = unflattenObject({ "a.b": 1, "a.c.0": 2 }, ".");
  deepStrictEqual(unflat, { a: { b: 1, c: [2] } });
}
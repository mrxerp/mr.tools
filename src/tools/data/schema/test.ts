import { strictEqual, deepStrictEqual } from "node:assert";
import {
  inferSchema,
  inferSingleSchema,
  mergeSchemas,
  validateSchema,
  validateValue,
  checkType,
  formatSchema,
  isEmail,
  isUuid,
  isDateTime,
  isUri,
} from "./tool.ts";

export async function runTest() {
  // inferSingleSchema primitives
  strictEqual(inferSingleSchema("hello").type, "string");
  strictEqual(inferSingleSchema(42).type, "integer");
  strictEqual(inferSingleSchema(3.14).type, "number");
  strictEqual(inferSingleSchema(true).type, "boolean");
  strictEqual(inferSingleSchema(null).type, "null");

  // inferSingleSchema string formats
  strictEqual(inferSingleSchema("test@example.com").format, "email");
  strictEqual(inferSingleSchema("550e8400-e29b-41d4-a716-446655440000").format, "uuid");
  strictEqual(inferSingleSchema("2024-01-15T10:30:00Z").format, "date-time");
  strictEqual(inferSingleSchema("https://example.com").format, "uri");

  // inferSingleSchema array
  const arrSchema = inferSingleSchema([1, 2, 3]);
  strictEqual(arrSchema.type, "array");
  strictEqual(arrSchema.items?.type, "integer");

  // inferSingleSchema object
  const objSchema = inferSingleSchema({ a: 1, b: "hello" });
  strictEqual(objSchema.type, "object");
  strictEqual(objSchema.properties?.a.type, "integer");
  strictEqual(objSchema.properties?.b.type, "string");
  deepStrictEqual(objSchema.required, ["a", "b"]);

  // mergeSchemas same type
  const merged = mergeSchemas([{ type: "string" }, { type: "string" }]);
  strictEqual(merged.type, "string");

  // mergeSchemas different types -> anyOf
  const anyOf = mergeSchemas([{ type: "string" }, { type: "number" }]);
  strictEqual(Array.isArray(anyOf.anyOf), true);

  // mergeSchemas objects
  const mergedObj = mergeSchemas([
    { type: "object", properties: { a: { type: "integer" } }, required: ["a"] },
    { type: "object", properties: { a: { type: "integer" }, b: { type: "string" } }, required: ["a", "b"] },
  ]);
  strictEqual(mergedObj.type, "object");
  strictEqual(mergedObj.properties?.a.type, "integer");
  strictEqual(mergedObj.properties?.b.type, "string");
  deepStrictEqual(mergedObj.required, ["a"]); // only 'a' in both

  // inferSchema from samples
  const samples = [
    { name: "Alice", age: 30, email: "alice@example.com" },
    { name: "Bob", age: 25, email: "bob@example.com" },
  ];
  const schema = inferSchema(samples);
  strictEqual(schema.type, "object");
  strictEqual(schema.properties?.name.type, "string");
  strictEqual(schema.properties?.age.type, "integer");
  strictEqual(schema.properties?.email.format, "email");
  deepStrictEqual(schema.required, ["name", "age", "email"]);

  // validateSchema valid
  const v1 = validateSchema({ name: "Charlie", age: 35, email: "charlie@example.com" }, schema);
  strictEqual(v1.valid, true);

  // validateSchema missing required
  const v2 = validateSchema({ name: "Charlie" }, schema);
  strictEqual(v2.valid, false);
  strictEqual(v2.errors?.some((e) => e.keyword === "required"), true);

  // validateSchema type mismatch
  const v3 = validateSchema({ name: "Charlie", age: "thirty" }, schema);
  strictEqual(v3.valid, false);
  strictEqual(v3.errors?.some((e) => e.keyword === "type"), true);

  // validateSchema format
  const v4 = validateSchema({ name: "Charlie", age: 35, email: "not-email" }, schema);
  strictEqual(v4.valid, false);
  strictEqual(v4.errors?.some((e) => e.keyword === "format"), true);

  // checkType
  strictEqual(checkType("hello", "string"), true);
  strictEqual(checkType(42, "integer"), true);
  strictEqual(checkType(3.14, "number"), true);
  strictEqual(checkType(true, "boolean"), true);
  strictEqual(checkType(null, "null"), true);
  strictEqual(checkType([], "array"), true);
  strictEqual(checkType({}, "object"), true);
  strictEqual(checkType(42, "string"), false);

  // isEmail, isUuid, isDateTime, isUri
  strictEqual(isEmail("a@b.c"), true);
  strictEqual(isEmail("invalid"), false);
  strictEqual(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  strictEqual(isUuid("not-uuid"), false);
  strictEqual(isDateTime("2024-01-15T10:30:00Z"), true);
  strictEqual(isDateTime("not-date"), false);
  strictEqual(isUri("https://example.com"), true);
  strictEqual(isUri("not-uri"), false);

  // formatSchema
  const formatted = formatSchema({ type: "object", properties: { a: { type: "integer" } } });
  strictEqual(formatted.includes("type"), true);
}
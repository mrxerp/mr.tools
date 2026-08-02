import { strictEqual } from "node:assert";
import { spreadsheetToJson, jsonToSpreadsheet, inferType } from "./tool.ts";

export async function runTest() {
  const csv = "name,age,active,joined\nAlice,25,true,2023-01-15\nBob,30,false,2023-02-20\nCarol,35,true,2023-03-10";

  const result = await spreadsheetToJson(csv, false, {
    columns: [
      { name: "name", type: "string" },
      { name: "age", type: "number" },
      { name: "active", type: "boolean" },
      { name: "joined", type: "date", dateFormat: "iso" },
    ],
    includeHeader: true,
    jsonFormat: "objects",
  });

  const json = result.json as Record<string, unknown>[];
  strictEqual(json.length, 3, "should have 3 rows");
  strictEqual(json[0].name, "Alice");
  strictEqual(json[0].age, 25);
  strictEqual(json[0].active, true);
  strictEqual(typeof json[0].joined, "string");

  const autoResult = await spreadsheetToJson(csv, false, {
    columns: [],
    includeHeader: true,
    jsonFormat: "objects",
  });
  const autoJson = autoResult.json as Record<string, unknown>[];
  strictEqual(typeof autoJson[0].age, "number", "age should be inferred as number");
  strictEqual(typeof autoJson[0].active, "boolean", "active should be inferred as boolean");

  strictEqual(inferType(["1", "2", "3"]), "number");
  strictEqual(inferType(["true", "false", "true"]), "boolean");
  strictEqual(inferType(["2023-01-01", "2023-02-02"]), "date");
  strictEqual(inferType(["hello", "world"]), "string");

  const backResult = await jsonToSpreadsheet(json, {
    columns: [],
    includeHeader: true,
    jsonFormat: "objects",
  });
  strictEqual(backResult.csv?.includes("Alice"), true);
  strictEqual(backResult.csv?.includes("25"), true);
}
import { strictEqual } from "node:assert";
import { mergeSpreadsheets } from "./tool.ts";

export async function runTest() {
  const file1 = "id,name,value\n1,Alice,100\n2,Bob,200";
  const file2 = "id,name,value\n3,Carol,300\n1,Alice,100";
  const file3 = "name,id,value\nDave,4,400";

  const result = await mergeSpreadsheets([
    { data: file1, isXlsx: false, name: "f1.csv" },
    { data: file2, isXlsx: false, name: "f2.csv" },
    { data: file3, isXlsx: false, name: "f3.csv" },
  ], { mode: "concat", keyColumns: ["id"], dedup: "first", includeHeader: true, outputFormat: "csv" });

  strictEqual(result.headers.join(","), "id,name,value");
  strictEqual(result.totalInputRows, 5);
  strictEqual(result.outputRows, 4, "should dedupe Alice");
  strictEqual(result.removedDuplicates, 1);

  const unionResult = await mergeSpreadsheets([
    { data: file1, isXlsx: false, name: "f1.csv" },
    { data: file2, isXlsx: false, name: "f2.csv" },
  ], { mode: "union", keyColumns: ["id"], dedup: "first", includeHeader: true, outputFormat: "csv" });
  strictEqual(unionResult.outputRows, 3, "union should have 3 unique by id");

  const intersectResult = await mergeSpreadsheets([
    { data: "id,val\n1,a\n2,b", isXlsx: false, name: "a.csv" },
    { data: "id,val\n2,x\n3,y", isXlsx: false, name: "b.csv" },
  ], { mode: "intersect", keyColumns: ["id"], dedup: "first", includeHeader: true, outputFormat: "csv" });
  strictEqual(intersectResult.outputRows, 1, "intersect should have only id=2");
  strictEqual(intersectResult.rows[0][0], "2");
}
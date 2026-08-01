import { strictEqual } from "node:assert";
import { stitchWorkbooks, stitchToCSV } from "./tool.ts";

export async function runTest() {
  const file1 = "name,value\nAlice,100\nBob,200";
  const file2 = "name,value\nCarol,300\nDave,400";

  const result = await stitchWorkbooks([
    { data: file1, isXlsx: false, name: "f1.csv" },
    { data: file2, isXlsx: false, name: "f2.csv" },
  ], { mode: "all-sheets", includeHeader: true, alignColumns: true, outputFormat: "csv" });

  strictEqual(result.stats.totalFiles, 2);
  strictEqual(result.stats.totalSheets, 2);
  strictEqual(result.stats.totalRows, 4);
  strictEqual(result.combinedHeaders.join(","), "name,value");
  strictEqual(result.combinedRows.length, 4);

  const csv = stitchToCSV(result, { mode: "all-sheets", includeHeader: true, alignColumns: true, outputFormat: "csv" });
  strictEqual(csv.includes("Alice"), true);
  strictEqual(csv.includes("Carol"), true);

  const file3 = "id,val\n1,a\n2,b";
  const file4 = "id,val\n2,x\n3,y";

  const nameResult = await stitchWorkbooks([
    { data: file3, isXlsx: false, name: "a.csv" },
    { data: file4, isXlsx: false, name: "b.csv" },
  ], { mode: "by-name", includeHeader: true, alignColumns: true, outputFormat: "csv" });

  strictEqual(nameResult.stats.totalSheets, 2);
  strictEqual(nameResult.combinedRows.length, 4);
}
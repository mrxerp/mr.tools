import { strictEqual } from "node:assert";
import { splitSpreadsheet, createZip } from "./tool.ts";

export async function runTest() {
  const csv = "name,region,value\nAlice,East,100\nBob,West,200\nCarol,East,150\nDave,North,300";
  const result = await splitSpreadsheet(csv, { mode: "column", columnName: "region", includeHeader: true, outputFormat: "csv" }, false);

  strictEqual(result.partCount, 3, "should create 3 parts for 3 regions");
  strictEqual(result.totalRows, 4, "should have 4 data rows");
  strictEqual(result.files.every(f => f.isCsv), true, "all files should be CSV");

  const zip = await createZip(result.files);
  strictEqual(zip.length > 0, true, "zip should not be empty");
  strictEqual(zip[0], 0x50, "zip should start with PK header");
  strictEqual(zip[1], 0x4b, "zip should start with PK header");

  const rowCsv = "a,b,c\n1,2,3\n4,5,6\n7,8,9\n10,11,12";
  const rowResult = await splitSpreadsheet(rowCsv, { mode: "rows", rowsPerFile: 2, includeHeader: true, outputFormat: "csv" }, false);
  strictEqual(rowResult.partCount, 2, "should create 2 parts for 4 rows with 2 per file");
}
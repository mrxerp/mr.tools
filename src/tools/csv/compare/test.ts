import { strictEqual } from "node:assert";
import { compareSpreadsheets, generateReport } from "./tool.ts";

export async function runTest() {
  const a = "name,value\nAlice,100\nBob,200\nCarol,300";
  const b = "name,value\nAlice,100\nBob,250\nDave,400";

  const result = await compareSpreadsheets(a, b, false, false, { ignoreCase: false, trimWhitespace: true, treatEmptyAsEqual: true });

  strictEqual(result.dims.rows, 4, "should have 4 rows (header + 3 data)");
  // Row 0 (header): 2 matches
  // Row 1 (Alice): 2 matches
  // Row 2 (Bob): name matches, value mismatches -> 1 match, 1 mismatch
  // Row 3 (Carol vs Dave): both mismatch -> 0 matches, 2 mismatches
  strictEqual(result.stats.matches, 5, "should have 5 matching cells");
  strictEqual(result.stats.mismatches, 3, "should have 3 mismatches");
  strictEqual(result.stats.onlyA, 0, "no rows only in A (same row count)");
  strictEqual(result.stats.onlyB, 0, "no rows only in B (same row count)");

  const report = generateReport(result);
  strictEqual(report.includes("MISMATCHES"), true, "report should include mismatches section");

  const caseA = "Name,Value\nALICE,100";
  const caseB = "name,value\nalice,100";
  const caseResult = await compareSpreadsheets(caseA, caseB, false, false, { ignoreCase: true, trimWhitespace: true, treatEmptyAsEqual: true });
  strictEqual(caseResult.stats.mismatches, 0, "ignoreCase should make them match");
}
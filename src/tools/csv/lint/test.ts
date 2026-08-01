import { strictEqual } from "node:assert";
import { lintCSV, generateReport } from "./tool.ts";

export async function runTest() {
  const validCsv = "name,age,city\nAlice,25,New York\nBob,30,Boston\nCarol,35,Chicago";
  const validResult = lintCSV(validCsv, { strictQuoting: true });
  strictEqual(validResult.stats.errors, 0, "valid CSV should have no errors");
  strictEqual(validResult.stats.warnings, 0, "valid CSV should have no warnings");
  strictEqual(validResult.headers.join(","), "name,age,city");
  strictEqual(validResult.sampleRows.length, 3);

  const mismatchedCsv = "name,age,city\nAlice,25\nBob,30,Boston,extra";
  const mismatchResult = lintCSV(mismatchedCsv, { strictQuoting: true });
  strictEqual(mismatchResult.stats.errors > 0, true, "should detect column mismatch");
  strictEqual(mismatchResult.issues.some(i => i.code === "MISSING_COLUMNS"), true);
  strictEqual(mismatchResult.issues.some(i => i.code === "EXTRA_COLUMNS"), true);

  const unmatchedQuote = 'name,age\nAlice,25\n"Bob,30\nCarol,35';
  const quoteResult = lintCSV(unmatchedQuote, { strictQuoting: true });
  strictEqual(quoteResult.issues.some(i => i.code === "UNMATCHED_QUOTE"), true, "should detect unmatched quote");

  const unquotedDelimiter = "name,age,city\nAlice,25,New York\nBob,30,\"Boston, MA\"";
  const delimResult = lintCSV(unquotedDelimiter, { strictQuoting: true });
  strictEqual(delimResult.issues.some(i => i.code === "MISSING_QUOTES"), true, "should warn on unquoted delimiter");

  const report = generateReport(validResult);
  strictEqual(report.includes("CSV LINT REPORT"), true);
}
import { strictEqual } from "node:assert";
import { cleanCSV } from "./tool.ts";

export async function runTest() {
  const dirty = 'name,age,city\r\n"Alice"," 25 ","New York"\r\n"Bob","30 ","Boston"\r\n"Alice"," 25 ","New York"';
  const result = cleanCSV(dirty, {
    trimWhitespace: true,
    dedupeRows: true,
    fixLineEndings: true,
    normalizeDelimiter: true,
    normalizeQuoting: true,
  });

  strictEqual(result.originalRowCount, 4, "original row count includes header");
  strictEqual(result.cleanedRowCount, 3, "cleaned row count includes header");
  strictEqual(result.removedRows, 1, "should remove one duplicate row");
  strictEqual(result.changes.length > 0, true, "should have changes");
  strictEqual(result.csv.includes("Alice,25,New York\nBob,30,Boston"), true, "should have cleaned and deduped data");
  strictEqual(!result.csv.includes("\r"), true, "should not have CR line endings");
}
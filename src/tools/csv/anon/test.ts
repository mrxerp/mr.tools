import { strictEqual } from "node:assert";
import { anonymize, generateReport } from "./tool.ts";

export async function runTest() {
  const csv = "name,email,phone,ssn\nAlice,alice@example.com,555-123-4567,123-45-6789\nBob,bob@test.org,(555) 987-6543,987-65-4321";

  const result = await anonymize(csv, false, {
    profiles: [
      { column: "name", type: "name" },
      { column: "email", type: "email", preserveDomain: false },
      { column: "phone", type: "phone", preserveFormat: false },
      { column: "ssn", type: "ssn" },
    ],
    customPatterns: [],
  });

  strictEqual(result.headers.join(","), "name,email,phone,ssn");
  strictEqual(result.rows.length, 2);
  strictEqual(result.stats.maskedCells > 0, true, "should have masked cells");
  strictEqual(result.anomalies.some(a => a.type === "email"), true, "should mask emails");
  strictEqual(result.anomalies.some(a => a.type === "phone"), true, "should mask phones");
  strictEqual(result.anomalies.some(a => a.type === "name"), true, "should mask names");
  strictEqual(result.anomalies.some(a => a.type === "ssn"), true, "should mask SSNs");

  for (const row of result.rows) {
    for (const cell of row) {
      strictEqual(cell, cell.trim(), "masked values should not have extra whitespace");
    }
  }

  const report = generateReport(result);
  strictEqual(report.includes("ANONYMIZATION REPORT"), true);
  strictEqual(report.includes("MASKED VALUES"), true);
}
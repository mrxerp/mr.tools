import { strictEqual } from "node:assert";
import { convertTimestamp, parseInput, formatRelative } from "./tool.ts";

export async function runTest() {
  // Test Unix timestamp (seconds)
  const tsSec = "1704067200"; // 2024-01-01 00:00:00 UTC
  const resultsSec = convertTimestamp(tsSec);
  strictEqual(resultsSec.length > 0, true, "Unix seconds parsed");

  const unixSecResult = resultsSec.find((r) => r.label === "Unix (seconds)");
  strictEqual(unixSecResult?.value, "1704067200", "Unix seconds preserved");

  const unixMsResult = resultsSec.find((r) => r.label === "Unix (milliseconds)");
  strictEqual(unixMsResult?.value, "1704067200000", "Unix milliseconds correct");

  const isoResult = resultsSec.find((r) => r.label === "ISO 8601 (UTC)");
  strictEqual(isoResult?.value, "2024-01-01T00:00:00.000Z", "ISO format correct");

  // Test Unix timestamp (milliseconds)
  const tsMs = "1704067200000";
  const resultsMs = convertTimestamp(tsMs);
  const isoResultMs = resultsMs.find((r) => r.label === "ISO 8601 (UTC)");
  strictEqual(isoResultMs?.value, "2024-01-01T00:00:00.000Z", "Unix ms parsed correctly");

  // Test ISO string
  const iso = "2024-01-01T00:00:00.000Z";
  const resultsIso = convertTimestamp(iso);
  strictEqual(resultsIso.length > 0, true, "ISO string parsed");

  // Test relative time (using a fixed date for testing)
  const pastDate = new Date("2024-01-01T00:00:00.000Z");
  // We can't easily test relative without mocking Date.now()
  // Just ensure it returns a string
  const rel = formatRelative(pastDate);
  strictEqual(typeof rel, "string", "relative time returns string");
  strictEqual(rel.includes("ago"), true, "relative time includes 'ago'");

  // Test empty input
  strictEqual(convertTimestamp("").length, 0, "empty input returns empty");
  strictEqual(convertTimestamp("   ").length, 0, "whitespace returns empty");

  // Test invalid input
  strictEqual(convertTimestamp("not a date").length, 0, "invalid input returns empty");

  // Test timezone results present
  const tzResult = resultsSec.find((r) => r.label === "UTC");
  strictEqual(tzResult !== undefined, true, "UTC timezone present");

  const nyResult = resultsSec.find((r) => r.label === "America/New_York");
  strictEqual(nyResult !== undefined, true, "New York timezone present");

  // Test now() returns results
  const nowResults = convertTimestamp(Date.now().toString());
  strictEqual(nowResults.length > 10, true, "now() returns multiple timezones");
}
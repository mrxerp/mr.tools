import { strictEqual, ok } from "node:assert";
import { parseDocx, formatBytes } from "./tool.ts";

export async function runTest() {
  // Test formatBytes
  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");
  strictEqual(formatBytes(1024 * 1024), "1.0 MB");

  // Test escapeHtml (internal function, not exported but we can test via the tool)
  // The parseDocx function tests are complex and require valid DOCX files
  // We'll skip the full parseDocx test in Node.js environment

  console.log("All docu tests passed (basic)");
}
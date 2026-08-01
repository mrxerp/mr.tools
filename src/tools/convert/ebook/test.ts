import { strictEqual, ok } from "node:assert";
import { formatBytes } from "./tool.ts";

export async function runTest() {
  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");
  strictEqual(formatBytes(1024 * 1024), "1.0 MB");
  strictEqual(formatBytes(1024 * 1024 * 1024), "1.00 GB");

  console.log("All ebook tests passed (basic)");
}
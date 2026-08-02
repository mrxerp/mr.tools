import { strictEqual } from "node:assert";
import { formatBytes, FAVICON_SIZES } from "./tool.ts";

export async function runTest() {
  strictEqual(FAVICON_SIZES.favicon.includes(16), true);
  strictEqual(FAVICON_SIZES.apple.includes(180), true);
  strictEqual(FAVICON_SIZES.android.includes(192), true);

  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  // generateFavicons requires createImageBitmap which is not available in Node.js
  // Tested in browser environment only

  console.log("All favicon tests passed (basic)");
}
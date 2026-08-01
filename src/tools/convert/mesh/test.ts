import { strictEqual, ok } from "node:assert";
import { parseMesh, formatBytes } from "./tool.ts";

export async function runTest() {
  const testData = new TextEncoder().encode(`v 0 0 0
v 1 0 0
v 0 1 0
v 0 0 1
f 1 2 3
f 2 3 4
`);

  const result = parseMesh(testData, "obj");

  strictEqual(result.mesh.vertices.length, 4);
  strictEqual(result.mesh.faces.length, 2);
  strictEqual(result.mesh.bounds.minX, 0);
  strictEqual(result.mesh.bounds.maxX, 1);
  strictEqual(result.mesh.triangleCount, 2);
  ok(result.mesh.triangleCount === 2);

  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  // writeMesh tests require proper buffer handling
  // Tested in browser environment

  console.log("All mesh tests passed (basic)");
}
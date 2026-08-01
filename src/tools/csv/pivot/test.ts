import { strictEqual } from "node:assert";
import { buildPivot, pivotToCSV } from "./tool.ts";

export async function runTest() {
  const csv = "region,product,sales\nEast,A,100\nEast,B,200\nWest,A,150\nWest,B,250\nEast,A,50";

  const result = await buildPivot(csv, false, {
    rows: ["region"],
    cols: ["product"],
    values: [{ field: "sales", agg: "sum" }],
  });

  strictEqual(result.headers[0], "region");
  strictEqual(result.headers.includes("A - sales (sum)") || result.headers.includes("B - sales (sum)"), true);
  strictEqual(result.rows.length, 3, "2 regions + grand total");

  const eastRow = result.rows.find(r => r[0] === "East");
  strictEqual(typeof eastRow, "object");
  strictEqual(typeof eastRow![1], "number");
  strictEqual(eastRow![1], 150, "East A sum = 100+50=150");

  const sumResult = await buildPivot(csv, false, {
    rows: ["region"],
    cols: [],
    values: [{ field: "sales", agg: "sum" }],
  });
  strictEqual(sumResult.headers[1], "sales (sum)");

  const csvOut = pivotToCSV(result);
  strictEqual(csvOut.includes("region"), true);
}
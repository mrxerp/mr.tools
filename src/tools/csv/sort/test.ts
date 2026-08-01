import { strictEqual } from "node:assert";
import { sortAndFilter } from "./tool.ts";

export async function runTest() {
  const csv = "name,region,age,value\nAlice,East,25,100\nBob,West,30,200\nCarol,East,35,150\nDave,North,40,300\nEve,South,28,250";

  const result = sortAndFilter(csv, {
    sortBy: [{ column: "region", direction: "asc" }, { column: "age", direction: "desc" }],
    filters: [{ column: "region", operator: "eq", value: "East" }],
    reorderColumns: ["region", "name", "age", "value"],
    includeHeader: true,
  });

  strictEqual(result.headers.join(","), "region,name,age,value");
  strictEqual(result.stats.filteredRows, 2, "should filter to 2 East rows");
  strictEqual(result.rows[0][0], "East");
  strictEqual(result.rows[1][0], "East");
  strictEqual(result.rows[0][2], "35", "older first due to desc sort");
  strictEqual(result.rows[1][2], "25");

  const noFilterResult = sortAndFilter(csv, {
    sortBy: [{ column: "value", direction: "desc" }],
    filters: [],
    reorderColumns: [],
    includeHeader: true,
  });
  strictEqual(noFilterResult.rows[0][3], "300", "highest value first");
  strictEqual(noFilterResult.stats.filteredRows, 5);
}
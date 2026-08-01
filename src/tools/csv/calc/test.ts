import { strictEqual } from "node:assert";
import { calculate, generatePreviewCsv } from "./tool.ts";

export async function runTest() {
  const csv = "name,value1,value2\nAlice,10,20\nBob,15,25\nCarol,30,10";

  const result = calculate(csv, {
    steps: [
      { id: "1", op: "add", targetColumn: "value1", sourceColumns: ["value1", "value2"], params: {}, enabled: true },
    ],
    newColumnName: "sum",
  });

  strictEqual(result.headers.includes("sum"), true);
  strictEqual(result.rows[0][result.headers.indexOf("sum")], "30");
  strictEqual(result.rows[1][result.headers.indexOf("sum")], "40");
  strictEqual(result.rows[2][result.headers.indexOf("sum")], "40");

  const pctResult = calculate(csv, {
    steps: [
      { id: "1", op: "pct-change", targetColumn: "value1", sourceColumns: ["value1", "value2"], params: {}, enabled: true },
    ],
    newColumnName: "pct",
  });
  strictEqual(pctResult.headers.includes("pct"), true);

  const concatResult = calculate(csv, {
    steps: [
      { id: "1", op: "concat", targetColumn: "name", sourceColumns: ["name", "value1"], params: { separator: "-" }, enabled: true },
    ],
    newColumnName: "combined",
  });
  strictEqual(concatResult.rows[0][concatResult.headers.indexOf("combined")], "Alice-10");

  const incResult = calculate(csv, {
    steps: [
      { id: "1", op: "increment", targetColumn: "value1", sourceColumns: ["value1"], params: { increment: "5" }, enabled: true },
    ],
    newColumnName: "inc",
  });
  strictEqual(Number(incResult.rows[0][incResult.headers.indexOf("inc")]), 15);
  strictEqual(Number(incResult.rows[1][incResult.headers.indexOf("inc")]), 20);

  const csvOut = generatePreviewCsv(result);
  strictEqual(csvOut.includes("sum"), true);
}
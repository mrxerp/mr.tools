import { deepStrictEqual, strictEqual } from "node:assert";
import {
  parseMarkdownTable,
  generateMarkdownTable,
  parseCSV,
  tableToCSV,
  type TableData,
} from "./tool.ts";

export async function runTest() {
  const md = `| Name | Age |\n|:---|---:|\n| Alice | 30 |\n| Bob | 25 |`;
  const parsed = parseMarkdownTable(md);
  deepStrictEqual(parsed?.headers, ["Name", "Age"]);
  deepStrictEqual(parsed?.alignments, ["left", "right"]);
  strictEqual(parsed?.rows.length, 2);
  strictEqual(parsed?.rows[0][0].value, "Alice");
  strictEqual(parsed?.rows[1][1].value, "25");

  const generated = generateMarkdownTable(parsed!);
  strictEqual(generated.includes("| Name | Age |"), true);
  strictEqual(generated.includes(":---"), true);
  strictEqual(generated.includes("---:"), true);

  const csv = `Name,Age\nAlice,30\nBob,25`;
  const csvParsed = parseCSV(csv);
  deepStrictEqual(csvParsed.headers, ["Name", "Age"]);
  strictEqual(csvParsed.rows.length, 2);

  const data: TableData = {
    headers: ["A", "B"],
    alignments: ["left", "right"],
    rows: [[{ value: "1", align: "left" }, { value: "2", align: "right" }]],
  };
  const csvOut = tableToCSV(data);
  strictEqual(csvOut, "A,B\n1,2");

  strictEqual(parseMarkdownTable("not a table"), null);
  strictEqual(parseMarkdownTable("|a|\n|---|\n|b|"), null);
}
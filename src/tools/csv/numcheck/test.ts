import { strictEqual } from "node:assert";
import { checkNumbers, generateReport } from "./tool.ts";

export async function runTest() {
  const csv = "name,price,quantity,rate\nAlice,$100.50,10,5%\nBob,200,20,10%\nCarol,not-a-number,30,15%\nDave,$300.00,40,20%\nEve,$50.00,50,25%";

  const result = await checkNumbers(csv, false, {
    detectNumericColumns: true,
    normalizeCurrency: true,
    normalizePercent: true,
    detectOutliers: false,
    outlierThreshold: 3,
  });

  strictEqual(result.headers.join(","), "name,price,quantity,rate");
  strictEqual(result.numericColumns.includes(1), true, "price should be numeric");
  strictEqual(result.numericColumns.includes(2), true, "quantity should be numeric");
  strictEqual(result.numericColumns.includes(3), true, "rate should be numeric");
  strictEqual(result.anomalies.some(a => a.type === "currency"), true, "should detect currency");
  strictEqual(result.anomalies.some(a => a.type === "percent"), true, "should detect percent");
  strictEqual(result.anomalies.some(a => a.type === "non-numeric"), true, "should detect non-numeric");

  const report = generateReport(result);
  strictEqual(report.includes("ANOMALIES"), true);
  strictEqual(report.includes("CURRENCY"), true);
  strictEqual(report.includes("PERCENT"), true);

  const outlierCsv = "id,value\n1,10\n2,12\n3,11\n4,1000\n5,9";
  const outlierResult = await checkNumbers(outlierCsv, false, {
    detectNumericColumns: true,
    normalizeCurrency: false,
    normalizePercent: false,
    detectOutliers: true,
    outlierThreshold: 1.5,
  });
  strictEqual(outlierResult.anomalies.some(a => a.type === "outlier"), true, "should detect outlier");
}
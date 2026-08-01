import { strictEqual } from "node:assert";
import {
  computeShift,
  computeShifts,
  csvField,
  parseTime,
  shiftMinutes,
  toCsv,
} from "./tool.ts";

export async function runTest() {
  strictEqual(parseTime("09:00"), 540);
  strictEqual(parseTime("23:59"), 1439);
  strictEqual(parseTime("24:00"), null);
  strictEqual(parseTime("25:00"), null);
  strictEqual(parseTime("9:60"), null);
  strictEqual(parseTime(""), null);
  strictEqual(parseTime("noon"), null);

  strictEqual(shiftMinutes("09:00", "17:00"), 480);
  strictEqual(shiftMinutes("09:00", "17:00", 60), 420);
  strictEqual(shiftMinutes("22:00", "06:00"), 480);
  strictEqual(shiftMinutes("22:00", "06:00", 30), 450);
  strictEqual(shiftMinutes("09:00", "09:00"), 1440);
  strictEqual(shiftMinutes("nope", "17:00"), 0);

  const day = computeShift({ date: "2024-06-03", in: "09:00", out: "17:00", breakMinutes: 60 }, 20);
  strictEqual(day.minutes, 420);
  strictEqual(day.hours, 7);
  strictEqual(day.pay, 140);
  strictEqual(day.overnight, false);

  const night = computeShift({ date: "2024-06-03", in: "22:00", out: "06:00", breakMinutes: 0 }, 25);
  strictEqual(night.minutes, 480);
  strictEqual(night.overnight, true);
  strictEqual(night.pay, 200);

  const totals = computeShifts(
    [
      { date: "2024-06-03", in: "09:00", out: "17:00", breakMinutes: 60 },
      { date: "2024-06-04", in: "09:00", out: "17:00", breakMinutes: 60 },
    ],
    20,
  );
  strictEqual(totals.totalMinutes, 840);
  strictEqual(totals.totalHours, 14);
  strictEqual(totals.totalPay, 280);
  strictEqual(totals.days, 2);
  strictEqual(totals.rows.length, 2);

  strictEqual(csvField("plain"), "plain");
  strictEqual(csvField('a,"b"'), '"a,""b"""');
  strictEqual(csvField("a,b"), '"a,b"');

  const csv = toCsv(
    [
      { date: "2024-06-03", in: "09:00", out: "17:00", breakMinutes: 60 },
      { date: "2024-06-04", in: "22:00", out: "06:00", breakMinutes: 0 },
    ],
    20,
  );
  strictEqual(
    csv.split("\n")[0],
    "Date,Clock in,Clock out,Break (min),Hours,Pay",
  );
  strictEqual(csv.includes("2024-06-03,09:00,17:00,60,7.00,140.00"), true);
  strictEqual(csv.includes("2024-06-04,22:00,06:00,0,8.00,160.00"), true);
  strictEqual(csv.includes("Total,15.00,300.00"), true);

  const empty = toCsv([], 20);
  strictEqual(empty.split("\n").length, 1);
}

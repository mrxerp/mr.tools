import { ok, strictEqual } from "node:assert";
import {
  businessDaysBetween,
  countWeekdays,
  dateDiff,
  durationSentence,
  weekdayName,
} from "./tool.ts";
import { parseDateInput } from "../_lib.ts";

const d = (s: string) => parseDateInput(s);

export async function runTest() {
  const r = dateDiff(d("2024-01-01"), d("2024-03-01"));
  ok(r.ok);
  strictEqual(r.years, 0);
  strictEqual(r.months, 2);
  strictEqual(r.days, 0);
  strictEqual(r.totalDays, 60);
  strictEqual(r.totalWeeks, 60 / 7);
  strictEqual(r.weekdays, 45);
  strictEqual(r.weekends, 16);

  const span = dateDiff(d("1990-06-15"), d("2024-06-15"));
  ok(span.ok);
  strictEqual(span.years, 34);
  strictEqual(span.months, 0);
  strictEqual(span.days, 0);
  strictEqual(span.totalDays, 12419);

  const leap = dateDiff(d("2000-02-29"), d("2024-02-28"));
  ok(leap.ok);
  strictEqual(leap.years, 23);
  strictEqual(leap.months, 11);
  strictEqual(leap.days, 30);

  const same = dateDiff(d("2024-06-15"), d("2024-06-15"));
  ok(same.ok);
  strictEqual(same.totalDays, 0);
  strictEqual(same.years, 0);

  const reversed = dateDiff(d("2024-03-01"), d("2024-01-01"));
  ok(reversed.ok);
  strictEqual(reversed.totalDays, 60);
  strictEqual(reversed.years, 0);
  strictEqual(reversed.months, 2);

  ok(!dateDiff(new Date(NaN), d("2024-01-01")).ok);
  ok(!dateDiff(d("2024-01-01"), new Date(NaN)).ok);

  strictEqual(countWeekdays(d("2024-01-01"), d("2024-01-05")), 5);
  strictEqual(businessDaysBetween(d("2024-01-01"), d("2024-01-05")), 5);
  strictEqual(businessDaysBetween(d("2024-01-01"), d("2024-01-08")), 6);
  strictEqual(businessDaysBetween(d("2024-01-06"), d("2024-01-07")), 0);
  strictEqual(businessDaysBetween(d("2024-03-01"), d("2024-01-01")), 45);
  strictEqual(businessDaysBetween(new Date(NaN), d("2024-01-01")), null);

  strictEqual(weekdayName(d("2024-01-01")), "Monday");
  strictEqual(weekdayName(d("2024-07-04")), "Thursday");
  strictEqual(weekdayName(d("2024-12-25")), "Wednesday");

  const sentence = durationSentence(span);
  ok(sentence.includes("34 years"));
  ok(sentence.includes("12,419 days"));
  ok(sentence.includes("Business days"));
}

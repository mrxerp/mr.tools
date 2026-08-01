import { ok, strictEqual } from "node:assert";
import {
  calculateAge,
  daysBetween,
  parseDateInput,
  type AgeBreakdown,
  type AgeResult,
} from "./tool.ts";

function d(s: string): Date {
  return parseDateInput(s);
}

function expectValid(result: AgeResult): AgeBreakdown {
  ok(result.ok, "expected valid result");
  return result;
}

export async function runTest() {
  ok(Number.isNaN(parseDateInput("").getTime()));
  ok(Number.isNaN(parseDateInput("not-a-date").getTime()));
  ok(Number.isNaN(parseDateInput("2024-02-31").getTime()), "invalid day rejected");
  ok(!Number.isNaN(parseDateInput("2024-02-29").getTime()), "leap day accepted");
  ok(!Number.isNaN(parseDateInput("2024-06-15").getTime()));

  const exact = expectValid(calculateAge(d("1990-06-15"), d("2024-06-15")));
  strictEqual(exact.years, 34);
  strictEqual(exact.months, 0);
  strictEqual(exact.days, 0);
  strictEqual(exact.nextBirthdayDays, 0);

  const leap = expectValid(calculateAge(d("2000-02-29"), d("2024-02-28")));
  strictEqual(leap.years, 23);
  strictEqual(leap.months, 11);
  strictEqual(leap.days, 30);
  strictEqual(leap.nextBirthdayDays, 1);

  const leapOn = expectValid(calculateAge(d("2000-02-29"), d("2024-02-29")));
  strictEqual(leapOn.years, 24);
  strictEqual(leapOn.days, 0);
  strictEqual(leapOn.nextBirthdayDays, 0);

  const monthEnd = expectValid(calculateAge(d("2000-01-31"), d("2024-03-01")));
  strictEqual(monthEnd.years, 24);
  strictEqual(monthEnd.months, 1);
  strictEqual(monthEnd.days, 1);

  const febEnd = expectValid(calculateAge(d("2000-01-31"), d("2024-02-28")));
  strictEqual(febEnd.years, 24);
  strictEqual(febEnd.months, 0);
  strictEqual(febEnd.days, 28);
  strictEqual(febEnd.nextBirthdayDays, 338);

  strictEqual(expectValid(calculateAge(d("2000-01-01"), d("2024-01-01"))).totalDays, 8766);

  const future = calculateAge(d("2030-01-01"), d("2024-01-01"));
  ok(!future.ok, "future birth date is rejected");
  strictEqual(future.reason, "future");
  ok(!calculateAge(new Date(NaN), d("2024-01-01")).ok);
  ok(!calculateAge(d("2024-01-01"), new Date(NaN)).ok);

  strictEqual(daysBetween(d("2024-01-01"), d("2024-12-31")), 365);
  strictEqual(daysBetween(d("2024-06-15"), d("2024-06-15")), 0);
  strictEqual(daysBetween(d("2024-12-31"), d("2024-01-01")), -365);
  strictEqual(daysBetween(new Date(NaN), d("2024-01-01")), null);
}

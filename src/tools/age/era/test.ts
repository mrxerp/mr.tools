import { ok, strictEqual } from "node:assert";
import {
  calendarParts,
  dateFromCalendar,
  formatCalendarDate,
  gregorianFromJdn,
  gregorianFromJulian,
  isoWeek,
  isoWeekString,
  jdnFromGregorian,
  jdnFromJulian,
  julianFromJdn,
  julianParts,
} from "./tool.ts";
import { dayDiff, parseDateInput } from "../_lib.ts";

const d = (s: string) => parseDateInput(s);

export async function runTest() {
  const hijri = calendarParts(d("2024-06-15"), "islamic-umalqura");
  ok(hijri);
  strictEqual(hijri.year, 1445);
  strictEqual(hijri.month, 12);
  strictEqual(hijri.day, 9);

  const hebrew = calendarParts(d("2024-06-15"), "hebrew");
  ok(hebrew);
  strictEqual(hebrew.year, 5784);
  strictEqual(hebrew.month, 10, "5784 is a Hebrew leap year, so Sivan is month 10");
  strictEqual(hebrew.day, 9);
  strictEqual(hebrew.monthName, "Sivan");

  const julian = calendarParts(d("2000-01-01"), "julian");
  ok(julian);
  strictEqual(julian.year, 1999);
  strictEqual(julian.month, 12);
  strictEqual(julian.day, 19);

  const buddhist = calendarParts(d("2024-06-15"), "buddhist");
  ok(buddhist);
  strictEqual(buddhist.year, 2567);

  const persian = calendarParts(d("2024-06-15"), "persian");
  ok(persian);
  strictEqual(persian.year, 1403);
  strictEqual(persian.month, 3);
  strictEqual(persian.day, 26);

  // JDN arithmetic
  strictEqual(jdnFromGregorian(2000, 1, 1), 2451545);
  strictEqual(jdnFromGregorian(1970, 1, 1), 2440588);
  strictEqual(jdnFromGregorian(1582, 10, 15), 2299161);
  strictEqual(julianFromJdn(2299161).year, 1582);
  strictEqual(julianFromJdn(2299161).month, 10);
  strictEqual(julianFromJdn(2299161).day, 5);
  strictEqual(jdnFromJulian(1582, 10, 5), 2299161);
  const g2000 = gregorianFromJdn(2451545);
  strictEqual(`${g2000.year}-${g2000.month}-${g2000.day}`, "2000-1-1");

  const jp = julianParts(d("2024-06-15"));
  strictEqual(jp.year, 2024);
  strictEqual(jp.month, 6);
  strictEqual(jp.day, 2);

  // Round trips
  const hijriBack = dateFromCalendar(1445, 12, 9, "islamic-umalqura");
  ok(hijriBack);
  strictEqual(dayDiff(hijriBack, d("2024-06-15")), 0);

  const hebrewBack = dateFromCalendar(5784, "Sivan", 9, "hebrew");
  ok(hebrewBack);
  strictEqual(dayDiff(hebrewBack, d("2024-06-15")), 0);

  const julianBack = gregorianFromJulian(1582, 10, 5);
  ok(julianBack);
  strictEqual(dayDiff(julianBack, d("1582-10-15")), 0);

  strictEqual(dateFromCalendar(2024, 13, 1, "julian"), null);
  strictEqual(dateFromCalendar(1445, 12, 32, "islamic-umalqura"), null);
  strictEqual(gregorianFromJulian(2024, 2, 30), null);

  // ISO week
  strictEqual(isoWeek(d("2024-01-01")).week, 1);
  strictEqual(isoWeek(d("2024-01-01")).weekYear, 2024);
  strictEqual(isoWeekString(d("2024-01-01")), "2024-W01");
  strictEqual(isoWeek(d("2023-01-01")).week, 52);
  strictEqual(isoWeek(d("2023-01-01")).weekYear, 2022);
  strictEqual(isoWeek(d("2021-01-01")).week, 53);
  strictEqual(isoWeek(d("2021-01-01")).weekYear, 2020);
  strictEqual(isoWeek(d("2024-12-30")).weekYear, 2025);
  strictEqual(isoWeek(d("2024-12-30")).week, 1);
  strictEqual(isoWeek(d("2025-03-15")).week, 11);
  strictEqual(isoWeek(d("2025-03-15")).weekYear, 2025);

  ok(formatCalendarDate(d("2024-06-15"), "hebrew").includes("Sivan"));
  ok(formatCalendarDate(d("2024-06-15"), "islamic-umalqura").includes("1445"));
}

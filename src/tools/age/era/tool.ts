import { MS_PER_DAY } from "../_lib.ts";

export const CALENDAR_IDS = [
  "gregory",
  "julian",
  "islamic-umalqura",
  "hebrew",
  "buddhist",
  "persian",
] as const;

export type CalendarId = (typeof CALENDAR_IDS)[number];

export interface CalendarParts {
  year: number;
  month: number;
  day: number;
  monthName: string;
  era: string;
}

export function calendarLabel(id: CalendarId): string {
  switch (id) {
    case "gregory":
      return "Gregorian";
    case "julian":
      return "Julian";
    case "islamic-umalqura":
      return "Hijri (Umm al-Qura)";
    case "hebrew":
      return "Hebrew";
    case "buddhist":
      return "Buddhist";
    case "persian":
      return "Persian";
  }
}

function dtf(calendar: CalendarId, month: "numeric" | "long"): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(`en-u-ca-${calendar}`, {
    year: "numeric",
    month,
    day: "numeric",
  });
}

function partsOf(date: Date, calendar: CalendarId): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of dtf(calendar, "numeric").formatToParts(date)) out[p.type] = p.value;
  return out;
}

function hebrewYearAt(date: Date): number {
  return Number(partsOf(date, "hebrew").year);
}

function hebrewYearStart(year: number): Date | null {
  const lo = Date.UTC(year - 3761, 7, 15);
  const hi = Date.UTC(year - 3761, 11, 31);
  if (hebrewYearAt(new Date(hi)) < year) return null;
  if (hebrewYearAt(new Date(lo)) > year) return null;
  let a = lo;
  let b = hi;
  while (a < b) {
    const mid = Math.floor((a + b) / 2);
    if (hebrewYearAt(new Date(mid)) < year) a = mid + 1;
    else b = mid;
  }
  return new Date(a);
}

const hebrewMonthCache = new Map<number, Record<string, number>>();

export function hebrewMonthsInYear(year: number): Record<string, number> {
  const cached = hebrewMonthCache.get(year);
  if (cached) return cached;
  const map: Record<string, number> = {};
  const start = hebrewYearStart(year);
  if (start) {
    let idx = 0;
    let last = "";
    for (let i = 0; i < 400; i++) {
      const t = new Date(start.getTime() + i * MS_PER_DAY);
      if (i > 0 && hebrewYearAt(t) !== year) break;
      const name = dtf("hebrew", "long").formatToParts(t).find((p) => p.type === "month")?.value ?? "";
      if (name !== last) {
        idx++;
        last = name;
        map[name] = idx;
      }
    }
  }
  hebrewMonthCache.set(year, map);
  return map;
}

export function calendarParts(date: Date, calendar: CalendarId): CalendarParts | null {
  if (Number.isNaN(date.getTime())) return null;
  if (calendar === "julian") {
    const j = julianParts(date);
    const long = dtf("julian", "long").formatToParts(date).find((p) => p.type === "month")?.value ?? "";
    return { year: j.year, month: j.month, day: j.day, monthName: long, era: "" };
  }
  const p = partsOf(date, calendar);
  const year = Number(p.year);
  const day = Number(p.day);
  let month = Number(p.month);
  let monthName = p.monthName ?? "";
  if (Number.isNaN(month)) {
    monthName = p.month;
    if (calendar === "hebrew") month = hebrewMonthsInYear(year)[p.month] ?? 0;
  } else if (!monthName) {
    monthName = p.month;
  }
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || month === 0) {
    return null;
  }
  return { year, month, day, monthName, era: p.era ?? "" };
}

function approxGregorianYearFor(calendar: CalendarId, year: number): number {
  switch (calendar) {
    case "gregory":
      return year;
    case "julian":
      return year;
    case "islamic-umalqura":
      return year + 579;
    case "hebrew":
      return year - 3761;
    case "buddhist":
      return year - 543;
    case "persian":
      return year + 621;
  }
}

export function dateFromCalendar(
  year: number,
  month: number | string,
  day: number,
  calendar: CalendarId,
): Date | null {
  let m = month;
  if (typeof month === "string") {
    if (calendar !== "hebrew") return null;
    m = hebrewMonthsInYear(year)[month];
  }
  if (typeof m !== "number" || m <= 0 || m > 13 || day < 1 || day > 31) return null;
  const approx = approxGregorianYearFor(calendar, year);
  const target = year * 10000 + m * 100 + day;
  let lo = Date.UTC(approx - 1, 0, 1);
  let hi = Date.UTC(approx + 2, 0, 1);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const p = calendarParts(new Date(mid), calendar);
    const val = p ? p.year * 10000 + p.month * 100 + p.day : Infinity;
    if (val < target) lo = mid + 1;
    else hi = mid;
  }
  const found = calendarParts(new Date(lo), calendar);
  if (!found || found.year * 10000 + found.month * 100 + found.day !== target) return null;
  return new Date(lo);
}

// Julian Day Number arithmetic (proleptic Julian), deterministic.
export function jdnFromGregorian(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

export function julianFromJdn(jdn: number): { year: number; month: number; day: number } {
  const c = jdn + 32082;
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  return {
    year: dd - 4800 + Math.floor(mm / 10),
    month: mm + 3 - 12 * Math.floor(mm / 10),
    day: e - Math.floor((153 * mm + 2) / 5) + 1,
  };
}

export function gregorianFromJdn(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const dd = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * dd) / 4);
  const mm = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + dd - 4800 + Math.floor(mm / 10),
    month: mm + 3 - 12 * Math.floor(mm / 10),
    day: e - Math.floor((153 * mm + 2) / 5) + 1,
  };
}

export function jdnFromJulian(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
}

export function julianParts(date: Date): { year: number; month: number; day: number } {
  return julianFromJdn(
    jdnFromGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate()),
  );
}

export function gregorianFromJulian(y: number, m: number, d: number): Date | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const jdn = jdnFromJulian(y, m, d);
  const back = julianFromJdn(jdn);
  if (back.year !== y || back.month !== m || back.day !== d) return null;
  const g = gregorianFromJdn(jdn);
  return new Date(g.year, g.month - 1, g.day);
}

export interface IsoWeek {
  week: number;
  weekYear: number;
}

export function isoWeek(date: Date): IsoWeek {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNr + 3);
  const firstThursday = t.getTime();
  t.setUTCMonth(0, 1);
  if (t.getUTCDay() !== 4) {
    t.setUTCMonth(0, 1 + ((4 - t.getUTCDay()) + 7) % 7);
  }
  return {
    week: 1 + Math.round((firstThursday - t.getTime()) / (7 * MS_PER_DAY)),
    weekYear: t.getUTCFullYear(),
  };
}

export function isoWeekString(date: Date): string {
  const w = isoWeek(date);
  return `${w.weekYear}-W${String(w.week).padStart(2, "0")}`;
}

export function formatCalendarDate(date: Date, calendar: CalendarId): string {
  const p = calendarParts(date, calendar);
  if (!p) return "";
  const era = p.era ? ` ${p.era}` : "";
  if (calendar === "hebrew" && p.monthName) {
    return `${calendarLabel(calendar)}: ${p.monthName} ${p.day}, ${p.year}${era}`;
  }
  return `${calendarLabel(calendar)}: ${p.month}/${p.day}/${p.year}${era}`;
}

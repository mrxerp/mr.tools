import { dayDiff, plural } from "../_lib.ts";

export interface DateDiffResult {
  ok: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  weekdays: number;
  weekends: number;
}

function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

export function countWeekdays(a: Date, b: Date): number {
  let count = 0;
  const cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  while (cur.getTime() <= end.getTime()) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function businessDaysBetween(a: Date, b: Date): number | null {
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const start = a.getTime() <= b.getTime() ? a : b;
  const end = a.getTime() <= b.getTime() ? b : a;
  return countWeekdays(start, end);
}

export function dateDiff(a: Date, b: Date): DateDiffResult {
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return {
      ok: false,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      weekdays: 0,
      weekends: 0,
    };
  }
  const forward = a.getTime() <= b.getTime();
  const start = new Date(
    (forward ? a : b).getFullYear(),
    (forward ? a : b).getMonth(),
    (forward ? a : b).getDate(),
  );
  const end = new Date(
    (forward ? b : a).getFullYear(),
    (forward ? b : a).getMonth(),
    (forward ? b : a).getDate(),
  );
  let years = end.getFullYear() - start.getFullYear();
  while (addMonths(start, years * 12).getTime() > end.getTime()) years--;
  let months = 0;
  while (months < 12 && addMonths(start, years * 12 + months + 1).getTime() <= end.getTime()) {
    months++;
  }
  const boundary = addMonths(start, years * 12 + months);
  const totalDays = dayDiff(start, end);
  const totalMs = Math.abs(b.getTime() - a.getTime());
  const weekdays = countWeekdays(start, end);
  return {
    ok: true,
    years,
    months,
    days: dayDiff(boundary, end),
    totalDays,
    totalWeeks: totalDays / 7,
    totalHours: totalMs / 3_600_000,
    totalMinutes: totalMs / 60_000,
    totalSeconds: totalMs / 1000,
    weekdays,
    weekends: totalDays + 1 - weekdays,
  };
}

export function durationSentence(r: DateDiffResult): string {
  if (!r.ok) return "";
  const parts: string[] = [];
  if (r.years) parts.push(plural(r.years, "year"));
  if (r.months) parts.push(plural(r.months, "month"));
  if (r.days) parts.push(plural(r.days, "day"));
  if (!parts.length) parts.push("0 days");
  const total = `${r.totalDays.toLocaleString("en-US")} days, ${r.totalWeeks.toFixed(1)} weeks, ${r.totalHours.toLocaleString("en-US")} hours`;
  return `${parts.join(", ")} — a total of ${total}. Business days (weekdays, both dates counted): ${r.weekdays}.`;
}

export function weekdayName(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

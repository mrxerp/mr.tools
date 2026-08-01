export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthdayDays: number;
}

export type AgeResult =
  | ({ ok: true } & AgeBreakdown)
  | { ok: false; reason: "invalid" | "future" };

const MS_PER_DAY = 86_400_000;

export function parseDateInput(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(y, mo - 1, day);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== day) {
    return new Date(NaN);
  }
  return date;
}

function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function nextBirthday(birth: Date, from: Date): Date {
  const candidate = new Date(from.getFullYear(), birth.getMonth(), birth.getDate());
  return candidate.getTime() >= from.getTime()
    ? candidate
    : new Date(from.getFullYear() + 1, birth.getMonth(), birth.getDate());
}

export function calculateAge(birth: Date, asOf: Date): AgeResult {
  if (Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime())) {
    return { ok: false, reason: "invalid" };
  }
  if (birth.getTime() > asOf.getTime()) {
    return { ok: false, reason: "future" };
  }
  const start = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
  const end = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  let years = end.getFullYear() - start.getFullYear();
  while (addMonths(start, years * 12).getTime() > end.getTime()) years--;
  let months = 0;
  while (months < 12 && addMonths(start, years * 12 + months + 1).getTime() <= end.getTime()) {
    months++;
  }
  const boundary = addMonths(start, years * 12 + months);
  return {
    ok: true,
    years,
    months,
    days: dayDiff(boundary, end),
    totalDays: dayDiff(start, end),
    nextBirthdayDays: dayDiff(end, nextBirthday(start, end)),
  };
}

export function daysBetween(a: Date, b: Date): number | null {
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return dayDiff(a, b);
}

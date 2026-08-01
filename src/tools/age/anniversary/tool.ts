import { dayDiff, localISO } from "../_lib.ts";

export interface Milestone {
  count: number;
  unit: "day" | "week" | "year";
  date: Date;
  iso: string;
  daysAway: number;
  label: string;
}

function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

export interface MilestoneOptions {
  dayStep?: number;
  weekStep?: number;
  yearStep?: number;
}

export function nextMilestone(
  from: Date,
  asOf: Date,
  unit: Milestone["unit"],
  step: number,
): Milestone {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const today = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const base = dayDiff(start, today);

  if (unit === "day" || unit === "week") {
    const daysPerStep = unit === "day" ? step : step * 7;
    const next = (Math.floor(base / daysPerStep) + 1) * daysPerStep;
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    date.setDate(date.getDate() + next);
    const count = unit === "day" ? next : next / 7;
    return {
      count,
      unit,
      date,
      iso: localISO(date),
      daysAway: next - base,
      label: `${count.toLocaleString("en-US")} ${unit}${count === 1 ? "" : "s"}`,
    };
  }

  const elapsed = today.getFullYear() - start.getFullYear();
  const thisAnniversary = addMonths(start, elapsed * 12);
  const passed = thisAnniversary.getTime() < today.getTime();
  const yearsForNext = passed ? elapsed + 1 : elapsed;
  const nextMultiple = Math.max(step, Math.ceil(yearsForNext / step) * step);
  const date = addMonths(start, nextMultiple * 12);
  if (start.getMonth() === 1 && start.getDate() === 29 && date.getMonth() === 1 && date.getDate() === 28) {
    date.setMonth(2, 1);
  }
  return {
    count: nextMultiple,
    unit,
    date,
    iso: localISO(date),
    daysAway: dayDiff(today, date),
    label: `${nextMultiple.toLocaleString("en-US")} ${unit}${nextMultiple === 1 ? "" : "s"}`,
  };
}

export function milestoneList(
  from: Date,
  asOf: Date,
  opts: MilestoneOptions = {},
): Milestone[] {
  return [
    nextMilestone(from, asOf, "year", opts.yearStep ?? 30),
    nextMilestone(from, asOf, "week", opts.weekStep ?? 100),
    nextMilestone(from, asOf, "day", opts.dayStep ?? 1000),
  ];
}

export function dayOfWeek(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

export function milestoneCardText(milestones: Milestone[], from: Date): string {
  const head = `From ${localISO(from)}:`;
  const lines = milestones.map(
    (m) => `${m.label} → ${m.iso} (${m.daysAway} day${m.daysAway === 1 ? "" : "s"} away)`,
  );
  return [head, ...lines].join("\n");
}

export function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

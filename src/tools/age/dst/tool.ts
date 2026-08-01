import { dayDiff, offsetAtMinutes, offsetLabel, pad2 } from "../_lib.ts";

export interface DSTTransition {
  date: string; // YYYY-MM-DD, the day the clock changes
  fromOffsetMinutes: number;
  toOffsetMinutes: number;
  direction: "start" | "end";
}

export function dayOffsetMinutes(year: number, month: number, day: number, zone: string): number {
  const wallAsUtc = Date.UTC(year, month, day);
  let t = wallAsUtc;
  for (let i = 0; i < 6; i++) {
    t = wallAsUtc - offsetAtMinutes(new Date(t), zone) * 60000;
  }
  return offsetAtMinutes(new Date(t + 43_200_000), zone);
}

export function dstTransitions(zone: string, year: number): DSTTransition[] {
  const out: DSTTransition[] = [];
  let prev: number | null = null;
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const off = dayOffsetMinutes(year, month, day, zone);
      if (prev !== null && off !== prev) {
        out.push({
          date: `${year}-${pad2(month + 1)}-${pad2(day)}`,
          fromOffsetMinutes: prev,
          toOffsetMinutes: off,
          direction: off > prev ? "start" : "end",
        });
      }
      prev = off;
    }
  }
  return out;
}

export function observesDST(zone: string, year: number): boolean {
  return dstTransitions(zone, year).length > 0;
}

export interface NextChange {
  date: string;
  daysUntil: number;
  direction: "start" | "end";
  fromOffsetMinutes: number;
  toOffsetMinutes: number;
}

export interface DSTResult {
  zone: string;
  year: number;
  observesDST: boolean;
  inDST: boolean;
  currentOffsetMinutes: number;
  currentOffsetLabel: string;
  transitions: DSTTransition[];
  nextChange: NextChange | null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dstForDate(zone: string, year: number, now: Date): DSTResult {
  const transitions = dstTransitions(zone, year);
  const currentOffsetMinutes = offsetAtMinutes(now, zone);
  const jan = offsetAtMinutes(new Date(Date.UTC(year, 0, 15)), zone);
  const jul = offsetAtMinutes(new Date(Date.UTC(year, 6, 15)), zone);
  const baseOffset = Math.min(jan, jul);
  const inDST = currentOffsetMinutes !== baseOffset;
  const today = startOfDay(now).getTime();
  let nextChange: NextChange | null = null;
  for (const t of transitions) {
    const [y, m, d] = t.date.split("-").map(Number);
    const change = new Date(y, m - 1, d);
    if (change.getTime() >= today) {
      nextChange = {
        date: t.date,
        daysUntil: dayDiff(startOfDay(now), change),
        direction: t.direction,
        fromOffsetMinutes: t.fromOffsetMinutes,
        toOffsetMinutes: t.toOffsetMinutes,
      };
      break;
    }
  }
  return {
    zone,
    year,
    observesDST: transitions.length > 0,
    inDST,
    currentOffsetMinutes,
    currentOffsetLabel: offsetLabel(currentOffsetMinutes),
    transitions,
    nextChange,
  };
}

export const POPULAR_ZONES = [
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

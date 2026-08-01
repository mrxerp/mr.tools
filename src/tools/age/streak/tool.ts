import { dayDiff, localISO } from "../_lib.ts";

export interface StreakStats {
  current: number;
  best: number;
  bestStart: string;
  bestEnd: string;
  total: number;
  hasToday: boolean;
}

export function computeStreaks(dates: string[], today: string): StreakStats {
  const set = new Set(dates);
  const t = new Date(today + "T00:00:00");
  if (Number.isNaN(t.getTime())) {
    return { current: 0, best: 0, bestStart: "", bestEnd: "", total: 0, hasToday: false };
  }
  const hasToday = set.has(today);
  let current = 0;
  let cursor = new Date(t);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  while (set.has(localISO(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...set]
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && dayDiff(new Date(k + "T00:00:00"), t) >= 0)
    .sort();
  let best = 0;
  let bestStart = "";
  let bestEnd = "";
  let run = 0;
  let runStart = "";
  let prev: string | null = null;
  for (const k of sorted) {
    if (prev === null) {
      run = 1;
      runStart = k;
    } else {
      const gap = dayDiff(new Date(prev + "T00:00:00"), new Date(k + "T00:00:00"));
      if (gap === 1) run++;
      else {
        run = 1;
        runStart = k;
      }
    }
    if (run > best) {
      best = run;
      bestStart = runStart;
      bestEnd = k;
    }
    prev = k;
  }
  return { current, best, bestStart, bestEnd, total: sorted.length, hasToday };
}

export interface GridCell {
  day: number | null;
  marked: boolean;
}

export function monthGrid(year: number, month: number, dates: string[]): GridCell[] {
  const set = new Set(dates);
  const first = new Date(year, month, 1);
  const cells: GridCell[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push({ day: null, marked: false });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, marked: set.has(localISO(new Date(year, month, d))) });
  }
  return cells;
}

export function streakCardText(dates: string[], today: string, habit: string): string {
  const s = computeStreaks(dates, today);
  const name = habit.trim() || "Habit";
  return [
    `${name} streak`,
    `Current: ${s.current} day${s.current === 1 ? "" : "s"}`,
    `Best: ${s.best} day${s.best === 1 ? "" : "s"}`,
    `Days tracked: ${s.total}`,
  ].join("\n");
}

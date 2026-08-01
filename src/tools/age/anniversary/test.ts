import { ok, strictEqual } from "node:assert";
import {
  dateLabel,
  dayOfWeek,
  milestoneCardText,
  milestoneList,
  nextMilestone,
} from "./tool.ts";
import { dayDiff, parseDateInput } from "../_lib.ts";

const d = (s: string) => parseDateInput(s);

export async function runTest() {
  const from = d("2000-01-01");
  const asof = d("2024-06-01");

  const day10k = nextMilestone(from, asof, "day", 1000);
  strictEqual(day10k.count, 9000);
  strictEqual(day10k.daysAway, 82);
  strictEqual(day10k.iso, "2024-08-22");
  strictEqual(dayDiff(from, day10k.date), 9000);

  const weeks100 = nextMilestone(from, asof, "week", 100);
  strictEqual(weeks100.count, 1300);
  strictEqual(weeks100.daysAway, 182);
  strictEqual(weeks100.iso, "2024-11-30");

  const years30 = nextMilestone(from, asof, "year", 30);
  strictEqual(years30.count, 30);
  strictEqual(years30.iso, "2030-01-01");
  strictEqual(years30.daysAway, dayDiff(asof, d("2030-01-01")));

  const before = nextMilestone(d("1994-05-10"), d("2024-01-01"), "year", 30);
  strictEqual(before.count, 30);
  strictEqual(before.iso, "2024-05-10");

  const after = nextMilestone(d("1994-05-10"), d("2024-06-01"), "year", 30);
  strictEqual(after.count, 60);
  strictEqual(after.iso, "2054-05-10");

  const leapFrom = nextMilestone(d("2000-02-29"), d("2025-03-01"), "year", 30);
  strictEqual(leapFrom.count, 30);
  strictEqual(leapFrom.iso, "2030-03-01");

  const list = milestoneList(from, asof);
  strictEqual(list.length, 3);
  strictEqual(list[0].unit, "year");
  strictEqual(list[1].unit, "week");
  strictEqual(list[2].unit, "day");

  strictEqual(dayOfWeek(d("2024-01-01")), "Monday");
  strictEqual(dayOfWeek(d("2000-01-01")), "Saturday");
  ok(dateLabel(d("2024-07-04")).includes("July"));

  const card = milestoneCardText(list, from);
  ok(card.includes("From 2000-01-01"));
  ok(card.includes("9,000 days"));
  ok(card.includes("2024-08-22"));
}

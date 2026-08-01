import { ok, strictEqual } from "node:assert";
import { computeStreaks, monthGrid, streakCardText } from "./tool.ts";

export async function runTest() {
  // Current streak with today marked
  let s = computeStreaks(["2024-06-13", "2024-06-14", "2024-06-15"], "2024-06-15");
  strictEqual(s.current, 3);
  strictEqual(s.best, 3);
  strictEqual(s.hasToday, true);

  // Today not marked: count a chain ending yesterday
  s = computeStreaks(["2024-06-14", "2024-06-15"], "2024-06-16");
  strictEqual(s.current, 2);
  strictEqual(s.hasToday, false);

  // Gap breaks the current streak
  s = computeStreaks(["2024-06-12", "2024-06-15", "2024-06-16"], "2024-06-16");
  strictEqual(s.current, 2);
  strictEqual(s.best, 2);

  // Best beats current (older longer run)
  s = computeStreaks(
    ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04", "2024-05-05", "2024-06-14", "2024-06-15", "2024-06-16"],
    "2024-06-16",
  );
  strictEqual(s.current, 3);
  strictEqual(s.best, 5);
  strictEqual(s.bestStart, "2024-05-01");
  strictEqual(s.bestEnd, "2024-05-05");
  strictEqual(s.total, 8);

  // Future dates ignored, invalid input safe
  s = computeStreaks(["2099-01-01", "not-a-date"], "2024-06-15");
  strictEqual(s.total, 0);
  strictEqual(s.current, 0);
  strictEqual(computeStreaks([], "garbage").best, 0);
  strictEqual(computeStreaks(["2024-06-15"], "2024-06-15").current, 1);

  // monthGrid layout
  let g = monthGrid(2024, 5, ["2024-06-15"]);
  strictEqual(g.length, 30 + 6, "June 2024 has 30 days and starts on Saturday, so 6 leading blanks");
  strictEqual(g[0].day, null);
  ok(g[6].day === 1);
  ok(g.filter((c) => c.day === 15)[0].marked);
  g = monthGrid(2024, 1, []);
  strictEqual(g.length, 29 + 4, "Feb 2024 starts Thursday, 29 days + 4 blanks");

  // Card text
  const card = streakCardText(["2024-06-14", "2024-06-15"], "2024-06-15", "Read");
  ok(card.includes("Read streak"));
  ok(card.includes("Current: 2 days"));
  ok(card.includes("Best: 2 days"));
  ok(card.includes("Days tracked: 2"));
  ok(streakCardText([], "2024-06-15", "").includes("Habit streak"));
}

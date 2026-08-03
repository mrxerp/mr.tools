import { strictEqual, ok, throws } from "node:assert";
import { parseCron, nextRuns, PRESETS } from "./tool.ts";

export async function runTest() {
  const runs = nextRuns("*/5 * * * *", new Date(2026, 0, 1, 12, 3), 2);
  strictEqual(runs.length, 2, "returns 2 runs");
  strictEqual(runs[0].getMinutes(), 5, "first run at :05");
  strictEqual(runs[1].getMinutes(), 10, "second run at :10");
  strictEqual(runs[0].getHours(), 12, "first run hour is 12");
  strictEqual(runs[1].getTime() > runs[0].getTime(), true, "runs are ordered");

  const monday = nextRuns("0 9 * * 1", new Date(2026, 0, 4, 12, 0), 1)[0];
  strictEqual(monday.getDay(), 1, "next run is Monday");
  strictEqual(monday.getHours(), 9, "next run at 09:00");
  strictEqual(monday.getMinutes(), 0, "next run on the hour");
  strictEqual(monday.getDate(), 5, "next run is Jan 5");

  throws(() => parseCron("60 * * * *"), /range/, "minute out of range throws");
  throws(() => parseCron("*/5"), /fields/, "too few fields throws");
  strictEqual(parseCron("0 9 * * 7").dow.has(0), true, "dow 7 means Sunday");
  strictEqual(parseCron("*/5 * * * *").minute.has(5), true, "step list parsed");
  ok(Object.keys(PRESETS).length >= 6, "presets defined");
}

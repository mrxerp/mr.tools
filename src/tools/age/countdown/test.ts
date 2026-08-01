import { ok, strictEqual } from "node:assert";
import {
  countdownParts,
  countdownShareUrl,
  encodeTarget,
  parseEncodedTarget,
} from "./tool.ts";

export async function runTest() {
  const start = new Date(2024, 0, 1, 0, 0, 0);

  const oneDay = countdownParts(new Date(2024, 0, 2, 0, 0, 0), start);
  strictEqual(oneDay.totalSeconds, 86400);
  strictEqual(oneDay.days, 1);
  strictEqual(oneDay.hours, 0);
  strictEqual(oneDay.minutes, 0);
  strictEqual(oneDay.seconds, 0);
  strictEqual(oneDay.done, false);

  const mixed = countdownParts(new Date(2024, 0, 3, 13, 45, 20), start);
  strictEqual(mixed.days, 2);
  strictEqual(mixed.hours, 13);
  strictEqual(mixed.minutes, 45);
  strictEqual(mixed.seconds, 20);

  const past = countdownParts(new Date(2023, 11, 25), start);
  strictEqual(past.done, true);
  strictEqual(past.totalSeconds, 0);
  strictEqual(past.days, 0);

  strictEqual(countdownParts(new Date(NaN), start).done, false);
  strictEqual(countdownParts(start, new Date(NaN)).done, false);

  const t = new Date(2025, 11, 31, 23, 59);
  strictEqual(encodeTarget(t), "2025-12-31T23:59");
  const round = parseEncodedTarget(encodeTarget(t));
  strictEqual(round.getTime(), t.getTime());

  ok(Number.isNaN(parseEncodedTarget("").getTime()));
  ok(Number.isNaN(parseEncodedTarget("2024-13-01T00:00").getTime()));
  ok(Number.isNaN(parseEncodedTarget("2024-01-01T25:00").getTime()));

  const base = "https://mr.tools/tools/age/countdown/";
  const url = countdownShareUrl(base, t);
  ok(url.startsWith(base + "?target="), "share url encodes target");
  const back = parseEncodedTarget(decodeURIComponent(url.slice(url.indexOf("=") + 1)));
  strictEqual(back.getTime(), t.getTime());
}

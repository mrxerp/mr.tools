import { ok, strictEqual } from "node:assert";
import {
  isWorking,
  meetingShareUrl,
  parseMeetingParams,
  refInstant,
  slotGrid,
} from "./tool.ts";
import { formatTime, parseDateInput } from "../_lib.ts";

export async function runTest() {
  strictEqual(isWorking(9, 0, 9, 17), true);
  strictEqual(isWorking(16, 30, 9, 17), true);
  strictEqual(isWorking(17, 0, 9, 17), false);
  strictEqual(isWorking(8, 59, 9, 17), false);

  const date = parseDateInput("2024-07-15");
  const ny = refInstant(date, "America/New_York", 9, 0);
  strictEqual(formatTime(ny, "America/New_York"), "09:00");
  strictEqual(formatTime(ny, "Europe/London"), "14:00");

  const rows = slotGrid(date, ["America/New_York", "Europe/London"], {
    startHour: 9,
    endHour: 17,
    stepMinutes: 30,
  });
  strictEqual(rows.length, 16);
  const early = rows[0];
  strictEqual(early.refLocal, "09:00");
  strictEqual(early.allWorking, true);
  strictEqual(early.cells[0].working, true);
  strictEqual(early.cells[1].working, true);

  const late = rows[11];
  strictEqual(late.refLocal, "14:30");
  strictEqual(late.cells[1].local, "19:30");
  strictEqual(late.cells[1].working, false);
  strictEqual(late.allWorking, false);

  const base = "https://mr.tools/tools/age/meeting/";
  const url = meetingShareUrl(base, date, 10, 30, ["America/New_York", "Europe/London"]);
  ok(url.startsWith(base + "?"), "share url has query");
  const parsed = parseMeetingParams(url.slice(base.length));
  ok(parsed, "share url parses back");
  strictEqual(parsed?.hour, 10);
  strictEqual(parsed?.minute, 30);
  strictEqual(parsed?.zones.join("|"), "America/New_York|Europe/London");
  strictEqual(parsed?.date.getTime(), date.getTime());
  strictEqual(parseMeetingParams(""), null);
  strictEqual(parseMeetingParams("?zones=America/New_York"), null);
}

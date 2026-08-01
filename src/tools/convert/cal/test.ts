import { strictEqual, ok } from "node:assert";
import { parseCsv, mergeCalendars, generateIcs, formatBytes } from "./tool.ts";

export async function runTest() {
  const csvText = `Start,End,Summary,Description,Location,AllDay
2024-01-15 10:00,2024-01-15 11:00,Meeting,Team sync,Conference Room,false
2024-01-16 09:00,2024-01-16 10:00,Call,Client call,Phone,false
2024-01-17,2024-01-17,All Day Event,Conference,,true`;

  const events = parseCsv(csvText);
  strictEqual(events.length, 3);
  strictEqual(events[0].summary, "Meeting");
  strictEqual(events[2].allDay, true);
  ok(events[0].dtstart instanceof Date);
  strictEqual(events[0].dtstart.getFullYear(), 2024);

  const merged = mergeCalendars(events, events);
  strictEqual(merged.length, 3);

  const ics = generateIcs(events);
  ok(ics.includes("BEGIN:VCALENDAR"));
  ok(ics.includes("BEGIN:VEVENT"));
  ok(ics.includes("Meeting"));
  ok(ics.includes("20240115"));  // date part only
  ok(ics.includes("20240117"));

  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  console.log("All cal tests passed");
}
import { strictEqual } from "node:assert";
import {
  dayOffsetMinutes,
  dstForDate,
  dstTransitions,
  observesDST,
} from "./tool.ts";
import { parseDateInput } from "../_lib.ts";

export async function runTest() {
  strictEqual(dayOffsetMinutes(2024, 2, 9, "America/New_York"), -300);
  strictEqual(dayOffsetMinutes(2024, 2, 10, "America/New_York"), -240);

  const ny = dstTransitions("America/New_York", 2024);
  strictEqual(ny.length, 2);
  strictEqual(ny[0].date, "2024-03-10");
  strictEqual(ny[0].direction, "start");
  strictEqual(ny[0].fromOffsetMinutes, -300);
  strictEqual(ny[0].toOffsetMinutes, -240);
  strictEqual(ny[1].date, "2024-11-03");
  strictEqual(ny[1].direction, "end");

  const london = dstTransitions("Europe/London", 2024);
  strictEqual(london.length, 2);
  strictEqual(london[0].date, "2024-03-31");
  strictEqual(london[1].date, "2024-10-27");

  const sydney = dstTransitions("Australia/Sydney", 2024);
  strictEqual(sydney.length, 2);
  strictEqual(sydney[0].date, "2024-04-07");
  strictEqual(sydney[0].direction, "end");
  strictEqual(sydney[1].date, "2024-10-06");
  strictEqual(sydney[1].direction, "start");

  const auckland = dstTransitions("Pacific/Auckland", 2024);
  strictEqual(auckland.length, 2);
  strictEqual(auckland[0].date, "2024-04-07");
  strictEqual(auckland[1].date, "2024-09-29");

  strictEqual(observesDST("Asia/Tokyo", 2024), false);
  strictEqual(dstTransitions("Asia/Tokyo", 2024).length, 0);

  const summer = dstForDate("America/New_York", 2024, parseDateInput("2024-06-01"));
  strictEqual(summer.observesDST, true);
  strictEqual(summer.inDST, true);
  strictEqual(summer.nextChange?.date, "2024-11-03");
  strictEqual(summer.nextChange?.daysUntil, 155);

  const winter = dstForDate("America/New_York", 2024, parseDateInput("2024-02-01"));
  strictEqual(winter.inDST, false);
  strictEqual(winter.nextChange?.date, "2024-03-10");
  strictEqual(winter.nextChange?.daysUntil, 38);

  const sydneySummer = dstForDate("Australia/Sydney", 2024, parseDateInput("2024-01-15"));
  strictEqual(sydneySummer.inDST, true);
  strictEqual(sydneySummer.nextChange?.date, "2024-04-07");

  const tokyo = dstForDate("Asia/Tokyo", 2024, parseDateInput("2024-06-01"));
  strictEqual(tokyo.observesDST, false);
  strictEqual(tokyo.inDST, false);
  strictEqual(tokyo.currentOffsetMinutes, 540);
  strictEqual(tokyo.nextChange, null);
}

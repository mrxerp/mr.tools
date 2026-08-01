import { ok, strictEqual } from "node:assert";
import {
  allZones,
  findZones,
  resolveZone,
  zoneInfo,
  zonesWithShortName,
} from "./tool.ts";
import { parseDateInput } from "../_lib.ts";

export async function runTest() {
  strictEqual(resolveZone("London"), "Europe/London");
  strictEqual(resolveZone("new york"), "America/New_York");
  strictEqual(resolveZone("America/Los_Angeles"), "America/Los_Angeles");
  strictEqual(resolveZone("nowhere-xyz"), null);
  strictEqual(resolveZone(""), null);

  ok(findZones("new york").includes("America/New_York"));
  ok(findZones("kolkata").includes("Asia/Kolkata"));
  ok(allZones().length > 50);

  const winter = parseDateInput("2024-01-15");
  const ny = zoneInfo("America/New_York", winter);
  strictEqual(ny.offsetMinutes, -300);
  strictEqual(ny.offsetLabel, "GMT-5");
  strictEqual(ny.shortName, "EST");
  strictEqual(ny.observesDST, true);
  ok(ny.collisions.length >= 2, "EST is ambiguous across zones");

  const tokyo = zoneInfo("Asia/Tokyo", winter);
  strictEqual(tokyo.offsetMinutes, 540);
  strictEqual(tokyo.observesDST, false);
  strictEqual(tokyo.shortName, "GMT+9");

  ok(zonesWithShortName("EST", winter).length >= 2);
  strictEqual(zonesWithShortName("", winter).length, 0);

  const sydney = zoneInfo("Australia/Sydney", winter);
  strictEqual(sydney.offsetMinutes, 660, "Sydney is on summer DST in January");
  strictEqual(sydney.observesDST, true);
}

import { ok, strictEqual } from "node:assert";
import {
  buildZoneParam,
  normalizeZones,
  parseZoneParam,
  zoneForCity,
  zoneTick,
} from "./tool.ts";

export async function runTest() {
  strictEqual(zoneForCity("london"), "Europe/London");
  strictEqual(zoneForCity("new york"), "America/New_York");
  strictEqual(zoneForCity("nowhere"), undefined);

  const winter = new Date(Date.UTC(2024, 0, 15, 17, 0, 0));
  const nyWinter = zoneTick(winter, "America/New_York");
  strictEqual(nyWinter.offsetMinutes, -300);
  strictEqual(nyWinter.time, "12:00");
  strictEqual(nyWinter.city, "New York");

  const londonWinter = zoneTick(winter, "Europe/London");
  strictEqual(londonWinter.offsetMinutes, 0);
  strictEqual(londonWinter.time, "17:00");

  const summer = new Date(Date.UTC(2024, 6, 15, 17, 0, 0));
  strictEqual(zoneTick(summer, "America/New_York").offsetMinutes, -240);
  strictEqual(zoneTick(summer, "Europe/London").offsetMinutes, 60);

  strictEqual(zoneTick(winter, "Asia/Tokyo").time, "02:00");
  strictEqual(zoneTick(winter, "Asia/Tokyo").offsetMinutes, 540);

  strictEqual(normalizeZones("london,new york,Tokyo").join("|"), "Europe/London|America/New_York|Asia/Tokyo");
  strictEqual(normalizeZones("London, LONDON, , Asia/Tokyo").join("|"), "Europe/London|Asia/Tokyo");
  strictEqual(normalizeZones("").length, 0);

  const zones = ["Europe/London", "America/New_York"];
  const param = buildZoneParam(zones);
  strictEqual(parseZoneParam(param).join("|"), zones.join("|"));
  ok(!parseZoneParam(null).length);
}

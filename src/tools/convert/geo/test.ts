import { strictEqual, ok } from "node:assert";
import { getElevationProfile, formatBytes } from "./tool.ts";

export async function runTest() {
  // Test formatBytes
  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  // Test getElevationProfile with mock data
  const track = {
    name: "Test",
    points: [
      { lat: 40.0, lon: -105.0, ele: 1600 },
      { lat: 40.1, lon: -105.1, ele: 1650 },
      { lat: 40.2, lon: -105.2, ele: 1700 },
    ],
  };

  const profile = getElevationProfile(track);
  strictEqual(profile.length, 3);
  strictEqual(profile[0].dist, 0);
  ok(profile[2].dist > profile[1].dist);

  // Test haversine distance calculation (indirect via profile)
  ok(profile[1].dist > 0);
  ok(profile[2].dist > profile[1].dist);

  // Note: parseGeo requires DOMParser (browser only)
  // Full integration tests run in browser environment

  console.log("All geo tests passed (basic)");
}
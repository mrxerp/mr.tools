import { formatTime, offsetAtMinutes, pad2 } from "../_lib.ts";

export interface CityPreset {
  city: string;
  zone: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { city: "London", zone: "Europe/London" },
  { city: "Paris", zone: "Europe/Paris" },
  { city: "Berlin", zone: "Europe/Berlin" },
  { city: "Moscow", zone: "Europe/Moscow" },
  { city: "New York", zone: "America/New_York" },
  { city: "Chicago", zone: "America/Chicago" },
  { city: "Los Angeles", zone: "America/Los_Angeles" },
  { city: "Toronto", zone: "America/Toronto" },
  { city: "Sao Paulo", zone: "America/Sao_Paulo" },
  { city: "Mexico City", zone: "America/Mexico_City" },
  { city: "Dubai", zone: "Asia/Dubai" },
  { city: "Mumbai", zone: "Asia/Kolkata" },
  { city: "Singapore", zone: "Asia/Singapore" },
  { city: "Hong Kong", zone: "Asia/Hong_Kong" },
  { city: "Tokyo", zone: "Asia/Tokyo" },
  { city: "Sydney", zone: "Australia/Sydney" },
  { city: "Auckland", zone: "Pacific/Auckland" },
];

export function zoneForCity(city: string): string | undefined {
  const q = city.trim().toLowerCase();
  return CITY_PRESETS.find((p) => p.city.toLowerCase() === q)?.zone;
}

export function cityLabel(zone: string): string {
  return (zone.split("/").pop() ?? zone).replace(/_/g, " ");
}

export interface ZoneTick {
  zone: string;
  city: string;
  time: string;
  offsetMinutes: number;
  offsetLabel: string;
  zoneName: string;
}

export function zoneTick(now: Date, zone: string): ZoneTick {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset",
  }).formatToParts(now);
  const offsetText = short.find((p) => p.type === "timeZoneName")?.value ?? "";
  const long = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "long",
  }).formatToParts(now);
  const zoneName = long.find((p) => p.type === "timeZoneName")?.value ?? "";
  const off = offsetAtMinutes(now, zone);
  return {
    zone,
    city: cityLabel(zone),
    time: formatTime(now, zone),
    offsetMinutes: off,
    offsetLabel: offsetText || `${off < 0 ? "-" : "+"}${pad2(Math.floor(Math.abs(off) / 60))}`,
    zoneName,
  };
}

export function normalizeZones(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]+/)) {
    const item = raw.trim();
    if (!item) continue;
    const zone = zoneForCity(item) ?? item;
    if (!seen.has(zone)) {
      seen.add(zone);
      out.push(zone);
    }
  }
  return out;
}

export function buildZoneParam(zones: string[]): string {
  return zones.map((z) => encodeURIComponent(z)).join(",");
}

export function parseZoneParam(param: string | null): string[] {
  return param
    ? param.split(",").map((z) => decodeURIComponent(z.trim())).filter(Boolean)
    : [];
}

import { formatTime, offsetAtMinutes, offsetLabel } from "../_lib.ts";

export const CITY_ZONES: Array<[string, string]> = [
  ["London", "Europe/London"],
  ["Paris", "Europe/Paris"],
  ["Berlin", "Europe/Berlin"],
  ["Moscow", "Europe/Moscow"],
  ["New York", "America/New_York"],
  ["Chicago", "America/Chicago"],
  ["Denver", "America/Denver"],
  ["Los Angeles", "America/Los_Angeles"],
  ["Toronto", "America/Toronto"],
  ["Mexico City", "America/Mexico_City"],
  ["Sao Paulo", "America/Sao_Paulo"],
  ["Buenos Aires", "America/Argentina/Buenos_Aires"],
  ["Reykjavik", "Atlantic/Reykjavik"],
  ["Dublin", "Europe/Dublin"],
  ["Lisbon", "Europe/Lisbon"],
  ["Rome", "Europe/Rome"],
  ["Madrid", "Europe/Madrid"],
  ["Amsterdam", "Europe/Amsterdam"],
  ["Zurich", "Europe/Zurich"],
  ["Stockholm", "Europe/Stockholm"],
  ["Warsaw", "Europe/Warsaw"],
  ["Athens", "Europe/Athens"],
  ["Istanbul", "Europe/Istanbul"],
  ["Cairo", "Africa/Cairo"],
  ["Johannesburg", "Africa/Johannesburg"],
  ["Nairobi", "Africa/Nairobi"],
  ["Lagos", "Africa/Lagos"],
  ["Tel Aviv", "Asia/Jerusalem"],
  ["Riyadh", "Asia/Riyadh"],
  ["Dubai", "Asia/Dubai"],
  ["Karachi", "Asia/Karachi"],
  ["Mumbai", "Asia/Kolkata"],
  ["New Delhi", "Asia/Kolkata"],
  ["Dhaka", "Asia/Dhaka"],
  ["Bangkok", "Asia/Bangkok"],
  ["Jakarta", "Asia/Jakarta"],
  ["Singapore", "Asia/Singapore"],
  ["Hong Kong", "Asia/Hong_Kong"],
  ["Shanghai", "Asia/Shanghai"],
  ["Beijing", "Asia/Shanghai"],
  ["Taipei", "Asia/Taipei"],
  ["Seoul", "Asia/Seoul"],
  ["Tokyo", "Asia/Tokyo"],
  ["Manila", "Asia/Manila"],
  ["Sydney", "Australia/Sydney"],
  ["Melbourne", "Australia/Melbourne"],
  ["Perth", "Australia/Perth"],
  ["Auckland", "Pacific/Auckland"],
  ["Honolulu", "Pacific/Honolulu"],
  ["Anchorage", "America/Anchorage"],
  ["San Francisco", "America/Los_Angeles"],
  ["Seattle", "America/Los_Angeles"],
  ["Boston", "America/New_York"],
  ["Miami", "America/New_York"],
  ["Houston", "America/Chicago"],
  ["Dallas", "America/Chicago"],
  ["Las Vegas", "America/Los_Angeles"],
];

export function allZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [];
}

export function findZones(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = allZones();
  if (all.includes(query.trim())) return [query.trim()];
  const hits = new Set<string>();
  for (const [city, zone] of CITY_ZONES) {
    if (city.toLowerCase() === q) hits.add(zone);
    const lowerZone = zone.toLowerCase();
    if (lowerZone === q || lowerZone.endsWith("/" + q)) hits.add(zone);
  }
  for (const zone of all) {
    const lower = zone.toLowerCase();
    if (lower === q || lower.endsWith("/" + q)) hits.add(zone);
    const cityPart = (lower.split("/").pop() ?? "").replace(/_/g, " ");
    if (cityPart === q) hits.add(zone);
  }
  return [...hits].slice(0, 12);
}

export function resolveZone(query: string): string | null {
  const hits = findZones(query);
  return hits[0] ?? null;
}

function nameOf(zone: string, date: Date, style: "short" | "long"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: style,
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

function shortOffsetOf(zone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const v = parts.find((p) => p.type === "timeZoneName")?.value;
  return v || offsetLabel(offsetAtMinutes(date, zone));
}

function observesDST(zone: string): boolean {
  const jan = offsetAtMinutes(new Date(Date.UTC(2024, 0, 15)), zone);
  const jul = offsetAtMinutes(new Date(Date.UTC(2024, 6, 15)), zone);
  return jan !== jul;
}

export function zonesWithShortName(name: string, date: Date): string[] {
  if (!name) return [];
  return allZones().filter((zone) => nameOf(zone, date, "short") === name);
}

export interface ZoneInfo {
  zone: string;
  city: string;
  offsetMinutes: number;
  offsetLabel: string;
  shortName: string;
  longName: string;
  observesDST: boolean;
  localTime: string;
  collisions: string[];
}

export function zoneInfo(zone: string, date: Date): ZoneInfo {
  const shortName = nameOf(zone, date, "short");
  const collisions = shortName ? zonesWithShortName(shortName, date) : [];
  return {
    zone,
    city: (zone.split("/").pop() ?? zone).replace(/_/g, " "),
    offsetMinutes: offsetAtMinutes(date, zone),
    offsetLabel: shortOffsetOf(zone, date),
    shortName,
    longName: nameOf(zone, date, "long"),
    observesDST: observesDST(zone),
    localTime: formatTime(date, zone),
    collisions,
  };
}

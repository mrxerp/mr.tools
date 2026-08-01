// TimeStampSmith: Timestamp conversion utilities

export interface TimestampResult {
  label: string;
  value: string;
}

export function parseInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try as Unix timestamp (seconds or milliseconds)
  const asNumber = Number(trimmed);
  if (!isNaN(asNumber) && trimmed.match(/^\d+$/)) {
    // Heuristic: if > 1e12, treat as milliseconds; else seconds
    return new Date(asNumber > 1e12 ? asNumber : asNumber * 1000);
  }

  // Try as ISO string or other date formats
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

export function formatDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone,
  }).format(date);
}

export function formatIso(date: Date): string {
  return date.toISOString();
}

export function formatUnixSeconds(date: Date): string {
  return Math.floor(date.getTime() / 1000).toString();
}

export function formatUnixMillis(date: Date): string {
  return date.getTime().toString();
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? "s" : ""} ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? "s" : ""} ago`;
  return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
}

export function getTimeZones(): string[] {
  return [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];
}

export function convertTimestamp(input: string): TimestampResult[] {
  const date = parseInput(input);
  if (!date) return [];

  const results: TimestampResult[] = [];

  // Unix timestamps
  results.push({ label: "Unix (seconds)", value: formatUnixSeconds(date) });
  results.push({ label: "Unix (milliseconds)", value: formatUnixMillis(date) });
  results.push({ label: "ISO 8601 (UTC)", value: formatIso(date) });

  // Relative time
  results.push({ label: "Relative", value: formatRelative(date) });

  // Time zones
  for (const tz of getTimeZones()) {
    results.push({ label: tz, value: formatDate(date, tz) });
  }

  return results;
}

export function now(): TimestampResult[] {
  return convertTimestamp(Date.now().toString());
}
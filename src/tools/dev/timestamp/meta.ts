import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "timestamp",
  name: "mr.timestamp",
  tagline: "Convert Unix timestamps to human dates across timezones, ISO strings, and relative time.",
  description: "mr.timestamp - Convert between Unix timestamps (seconds/milliseconds) and human-readable dates across multiple timezones. Also generates ISO 8601 strings and relative time formatting. Instant, local, and timezone-aware.",
  tags: ["timestamp", "epoch", "unix", "date", "timezone", "iso", "relative"],
  icon: "clock",
  difficulty: "Easy",
  offline: true,
  related: ["cron"],
};
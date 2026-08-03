import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "crontab",
  name: "mr.crontab",
  tagline: "Build cron expressions and see their next run times.",
  description: "mr.crontab — Build and validate cron expressions with live parsing and next-run prediction. Supports standard 5-field cron syntax (minute, hour, day of month, month, day of week) with lists, ranges, and steps. Everything runs locally in your browser.",
  tags: ["cron", "crontab", "schedule", "timer", "expression", "time"],
  icon: "clock",
  difficulty: "Medium",
  offline: true,
  related: ["timestamp", "math", "percent"],
};

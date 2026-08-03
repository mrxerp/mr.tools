import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "shift",
  name: "mr.shift",
  tagline: "Plan shifts, compute hours and pay, export a CSV.",
  description:
    "mr.shift - Log clock in/out times per day with breaks, and get hours, pay and weekly totals instantly. Overnight shifts are handled automatically, everything is saved locally in your browser, and one click exports a plain CSV - nothing uploads.",
  tags: ["shift", "timesheet", "hours", "pay", "csv"],
  icon: "form",
  difficulty: "Medium",
  offline: true,
  related: ["date-diff", "streak", "countdown"],
};

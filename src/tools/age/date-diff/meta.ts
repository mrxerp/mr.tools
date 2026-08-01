import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "date-diff",
  name: "mr.date diff",
  tagline: "The exact duration between two dates, in every unit.",
  description:
    "mr.date diff — Work out the exact years, months, days, weeks, hours, minutes and seconds between two dates, plus business days (weekdays, both endpoints counted). Copy the result as a ready-to-paste sentence — nothing uploads.",
  tags: ["date", "diff", "duration", "days between", "business days"],
  icon: "calc",
  difficulty: "Easy",
  offline: true,
  related: ["anniversary", "countdown", "age"],
};

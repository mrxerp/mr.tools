import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "era",
  name: "mr.era",
  tagline: "Convert dates between Gregorian, Julian, Hijri, Hebrew and more.",
  description:
    "mr.era - See any date in the Gregorian, Julian, Hijri, Hebrew, Buddhist and Persian calendars on one screen, convert dates back to Gregorian, and get the ISO week number and year. Calendar math uses the browser's Intl data and Julian Day Number arithmetic - nothing uploads.",
  tags: ["calendar", "hijri", "hebrew", "julian", "iso week"],
  icon: "convert",
  difficulty: "Medium",
  offline: true,
  related: ["date-diff", "anniversary", "timezone"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "timezone",
  name: "mr.timezone",
  tagline: "Find a place's IANA timezone and decode ambiguous abbreviations.",
  description:
    "mr.timezone — Look up the IANA timezone for a city or region name, see its current UTC offset and abbreviation, and get warned when an abbreviation like EST is shared by several different zones. Everything runs in your browser, nothing uploads.",
  tags: ["timezone", "iana", "city", "abbreviation", "offset"],
  icon: "arrow",
  difficulty: "Easy",
  offline: true,
  related: ["world-clock", "meeting", "dst"],
};

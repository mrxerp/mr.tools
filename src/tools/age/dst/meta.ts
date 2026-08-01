import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "dst",
  name: "mr.dst",
  tagline: "When does daylight saving start and end for any timezone?",
  description:
    "mr.dst — Find the exact DST start and end dates for any IANA timezone and year, whether the zone is on DST right now, and how many days until the next clock change. Rules are approximated from observed UTC offset changes — nothing uploads.",
  tags: ["dst", "daylight saving", "timezone", "clock change", "offset"],
  icon: "sliders",
  difficulty: "Medium",
  offline: true,
  related: ["world-clock", "timezone", "meeting"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "world-clock",
  name: "mr.world clock",
  tagline: "A live clock grid for any set of cities, with shareable links.",
  description:
    "mr.world clock - Compare the current time across any set of cities side by side, with each zone's UTC offset and name. Share the grid with a single URL - nothing uploads, everything runs in your browser.",
  tags: ["world clock", "time", "timezone", "clocks", "cities"],
  icon: "clock",
  difficulty: "Easy",
  offline: true,
  related: ["meeting", "timezone", "dst"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "meeting",
  name: "mr.meeting",
  tagline: "Find a meeting time that works across 2–4 timezones.",
  description:
    "mr.meeting — Compare working hours across 2–4 timezones on a grid, spot the overlapping slots, and generate a shareable URL that opens pre-filled. No account, no plugin — everything runs in your browser.",
  tags: ["meeting", "timezone", "scheduler", "overlap", "working hours"],
  icon: "link",
  difficulty: "Medium",
  offline: true,
  related: ["world-clock", "timezone", "dst"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "streak",
  name: "mr.streak",
  tagline: "Track a habit on a local grid and flex your streak.",
  description:
    "mr.streak - Tap days on a calendar to track a habit, with current and best streak computed instantly and saved only in your browser. Copy a shareable streak card to show it off - no account, nothing uploads, works offline.",
  tags: ["streak", "habit", "tracker", "calendar", "local"],
  icon: "check",
  difficulty: "Easy",
  offline: true,
  related: ["anniversary", "countdown", "date-diff"],
};

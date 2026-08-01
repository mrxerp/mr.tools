import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "vocal",
  name: "mr.vocal",
  tagline: "Karaoke mode: phase-cancel the center channel to remove vocals.",
  description:
    "mr.vocal — Remove center-panned vocals from a stereo track using phase cancellation, or flip it to isolate the center instead. Honest limits: works only on vocals that sit in the center, and there is no real-time preview. Fully local.",
  tags: ["vocal remover", "karaoke", "audio", "phase cancel", "vocals"],
  icon: "redact",
  difficulty: "Hard",
  offline: true,
  related: ["mixer", "trim"],
};

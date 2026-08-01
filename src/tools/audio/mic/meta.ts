import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mic",
  name: "mr.mic",
  tagline: "Check your microphone: live level meter, noise floor, clipping alerts.",
  description:
    "mr.mic — Watch your microphone's live level, see an estimated noise floor, and get clipping alerts so you can set up before a call or recording. Nothing is recorded or uploaded.",
  tags: ["microphone", "level", "meter", "noise floor", "clipping", "audio"],
  icon: "check",
  difficulty: "Medium",
  offline: true,
  related: ["vocal", "bpm"],
};

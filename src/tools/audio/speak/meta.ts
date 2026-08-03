import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "speak",
  name: "mr.speak",
  tagline: "Turn pasted text into spoken audio with your browser's own voices.",
  description:
    "mr.speak - Paste text and hear it spoken by the voices installed on your device. Adjust rate and pitch, and record the output where your browser supports it. Nothing is uploaded.",
  tags: ["text to speech", "tts", "speech", "voice", "audio"],
  icon: "audio",
  difficulty: "Easy",
  offline: true,
  related: ["tone", "mic"],
};

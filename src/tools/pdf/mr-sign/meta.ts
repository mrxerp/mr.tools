import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mr-sign",
  name: "mr sign",
  tagline: "Sign a PDF with a drawn signature.",
  description: "mr sign — Draw your signature and place it on a page of your PDF. The image is embedded with pdf-lib; everything runs in your browser — nothing uploads.",
  tags: ["pdf", "sign", "signature", "draw"],
  icon: "sign",
  difficulty: "Medium",
  offline: true,
  related: ["mr-form", "mr-annotate"],
};

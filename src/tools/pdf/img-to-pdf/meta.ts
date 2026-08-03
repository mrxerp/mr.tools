import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "img-to-pdf",
  name: "mr.img to pdf",
  tagline: "Turn PNG or JPEG images into a PDF.",
  description: "Turn PNG or JPEG images into a single PDF - one page per image or all stacked on one page. Everything runs in your browser.",
  tags: ["pdf", "image", "png", "jpg", "jpeg", "convert"],
  icon: "image",
  difficulty: "Easy",
  offline: true,
  related: ["mr-convert", "mr-merge"],
};

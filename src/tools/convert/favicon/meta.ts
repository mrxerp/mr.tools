import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "favicon",
  name: "mr favicon",
  tagline: "Generate complete favicon set (ico, PNGs, maskable, apple-touch-icon) + manifest from one image.",
  description: "Generate a complete favicon and app-icon set (favicon.ico, all PNG sizes, maskable icons, apple-touch-icon) from one source image. Writes a ready Web App Manifest and previews every size on realistic tab, bookmark, and home-screen mockups. Uses Canvas/OffscreenCanvas. Runs entirely in your browser.",
  tags: ["favicon", "icon", "png", "ico", "manifest", "pwa", "apple-touch-icon", "maskable", "generate"],
  icon: "image",
  difficulty: "Easy",
  offline: true,
  related: ["image", "archive"],
};
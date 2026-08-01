import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "archive",
  name: "mr archive",
  tagline: "Create and extract ZIP, TAR, GZIP archives with in-archive preview.",
  description: "Create and extract ZIP, TAR, and GZIP archives entirely in your browser. Preview contents before extraction, select individual files, and password-protect ZIPs with WebCrypto AES. No uploads, no size limits.",
  tags: ["archive", "zip", "tar", "gzip", "extract", "compress", "password"],
  icon: "compress",
  difficulty: "Medium",
  offline: true,
  related: ["ebook", "docu"],
};
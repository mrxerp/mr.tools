import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "uuid",
  name: "mr.uuid",
  tagline: "Generate UUID v4 and v7 identifiers, one or many at a time.",
  description: "mr.uuid - Generate cryptographically random UUID v4 identifiers or time-ordered UUID v7 identifiers, one or many at a time. Runs entirely in your browser with Web Crypto, nothing is uploaded.",
  tags: ["uuid", "guid", "identifier", "random", "generate", "v4", "v7"],
  icon: "dice",
  difficulty: "Easy",
  offline: true,
  related: ["hash", "base", "encode", "password"],
};

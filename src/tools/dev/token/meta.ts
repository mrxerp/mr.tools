import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "token",
  name: "mr.token",
  tagline: "Generate random tokens with your choice of characters.",
  description: "mr.token — Generate secure random tokens entirely in your browser. Choose the length, character classes (lowercase, uppercase, digits, symbols), and how many tokens to produce. Uses the Web Crypto API with rejection sampling for uniform randomness — nothing is sent anywhere.",
  tags: ["token", "random", "generator", "secret", "key", "string"],
  icon: "key",
  difficulty: "Easy",
  offline: true,
  related: ["hash", "password", "port"],
};

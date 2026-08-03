import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "bcrypt",
  name: "mr.bcrypt",
  tagline: "Hash passwords with bcrypt and verify them against a hash.",
  description: "mr.bcrypt — Hash passwords with bcrypt and verify plaintext against an existing bcrypt hash, with selectable cost rounds. Everything runs locally in your browser, nothing is ever uploaded.",
  tags: ["bcrypt", "hash", "password", "verify", "security", "hashing"],
  icon: "lock",
  difficulty: "Easy",
  offline: true,
  related: ["hash", "jwt", "password", "age"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "jwt",
  name: "mr.jwt",
  tagline: "Decode and inspect JWT headers, payloads, and signatures.",
  description: "mr.jwt - Decode and inspect JWT headers, payloads, and signatures, and verify HS256 signatures locally with Web Crypto. Tokens never leave your browser.",
  tags: ["jwt", "token", "decode", "verify", "hmac", "hs256", "signature"],
  icon: "sign",
  difficulty: "Medium",
  offline: true,
  related: ["json", "encode", "hash", "bcrypt"],
};

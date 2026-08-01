import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "hash",
  name: "mr.hash",
  tagline: "Compute MD5, SHA-1, SHA-256/384/512, and HMAC for text or files.",
  description: "mr.hash — Compute cryptographic hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512) and HMAC for text or files. All processing happens locally in your browser using the Web Crypto API. Supports incremental file hashing for large files.",
  tags: ["hash", "md5", "sha256", "hmac", "checksum", "crypto"],
  icon: "hash",
  difficulty: "Easy",
  offline: true,
  related: ["encode", "dotenv"],
};
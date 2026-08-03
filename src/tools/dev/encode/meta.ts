import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "encode",
  name: "mr.encode",
  tagline: "Encode/decode Base64, URL, URI component, HTML entities, Unicode escapes, and JWT payloads.",
  description: "mr.encode - Live two-way encoding and decoding for Base64, URL encoding, URI component encoding, HTML entities, Unicode escapes, and JWT payload decoding. All transformations happen instantly in your browser.",
  tags: ["encode", "decode", "base64", "url", "uri", "html", "unicode", "jwt"],
  icon: "convert",
  difficulty: "Easy",
  offline: true,
  related: ["hash", "json"],
};
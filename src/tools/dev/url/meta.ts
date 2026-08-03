import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "url",
  name: "mr.url",
  tagline: "Parse any URL into its parts with decoded query parameters.",
  description: "mr.url — Parse any URL into scheme, credentials, host, port, path, query parameters, and fragment, with percent-decoded query keys and values. Works for web schemes and non-host schemes like mailto, entirely in your browser.",
  tags: ["url", "parse", "query", "params", "query-string", "decode"],
  icon: "link",
  difficulty: "Easy",
  offline: true,
  related: ["encode", "json", "base", "regex"],
};

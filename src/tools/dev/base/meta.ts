import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "base",
  name: "mr.base",
  tagline: "Convert numbers between bases 2 and 36, big integers included.",
  description: "mr.base — Convert numbers between any bases from 2 to 36, including values too large for standard number types thanks to BigInt. Instant and fully offline in your browser.",
  tags: ["base", "radix", "convert", "binary", "hex", "octal", "bigint"],
  icon: "calc",
  difficulty: "Easy",
  offline: true,
  related: ["encode", "uuid", "hash", "url"],
};

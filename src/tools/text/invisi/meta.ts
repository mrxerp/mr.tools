import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "invisi",
  name: "mr.invisi",
  tagline: "Reveal invisible and zero-width characters in pasted text.",
  description: "mr.invisi - Show every space, tab, line ending, no-break space, zero-width character, and BOM in your text with a character-by-character map, and copy a cleaned version.",
  tags: ["invisible", "whitespace", "zero-width", "unicode", "clean"],
  icon: "eye",
  difficulty: "Easy",
  offline: true,
  related: ["regex", "case"],
};

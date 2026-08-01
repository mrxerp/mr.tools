export interface ToolMeta {
  /** Folder slug, e.g. "mr-merge". Must match the folder name. */
  slug: string;
  /** Human name, e.g. "mr merge". */
  name: string;
  /** One-line pitch shown under the title. */
  tagline: string;
  /** Longer SEO/description copy for the page and search. */
  description: string;
  tags: string[];
  /** Icon key from the shared Icon set (src/components/Icon.astro). */
  icon: string;
  difficulty: "Easy" | "Medium" | "Hard";
  offline: boolean;
  /** Slugs of related tools (same family or across families). */
  related: string[];
}

export interface FamilyMeta {
  /** Folder id, e.g. "pdf". */
  id: string;
  /** Display name, e.g. "mr.pdf". */
  name: string;
  tagline: string;
  description: string;
  icon: string;
}

/** Enriched tool record as produced by scripts/build-tool-index.mjs. */
export interface ToolRecord extends ToolMeta {
  href: string;
  familyName: string;
  familyHref: string;
}

export type Difficulty = ToolMeta["difficulty"];

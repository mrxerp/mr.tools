/**
 * mr-tool-new.mjs — scaffolds a new tool folder following the tool contract.
 *
 * Usage:
 *   node scripts/mr-tool-new.mjs <family> <slug> [name] [tagline]
 *   node scripts/mr-tool-new.mjs --new-family "<Family Name>" <family> <slug> [name] [tagline]
 *
 * Creates:
 *   src/tools/<family>/_meta.ts        (only with --new-family)
 *   src/tools/<family>/<slug>/meta.ts
 *   src/tools/<family>/<slug>/tool.ts
 *   src/tools/<family>/<slug>/index.astro
 *   src/tools/<family>/<slug>/test.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsRoot = join(root, "src", "tools");

const args = process.argv.slice(2);
let newFamilyName = null;
if (args[0] === "--new-family") {
  newFamilyName = args[1];
  args.splice(0, 2);
}

const [family, slug, nameArg, taglineArg] = args;
if (!family || !slug) {
  console.error(
    "usage: node scripts/mr-tool-new.mjs <family> <slug> [name] [tagline]",
  );
  console.error(
    "       node scripts/mr-tool-new.mjs --new-family \"<Family Name>\" <family> <slug> [name] [tagline]",
  );
  process.exit(1);
}

const displayName = nameArg ?? slug;
const tagline = taglineArg ?? "A small mr tool that does one thing well.";
const familyDir = join(toolsRoot, family);

if (newFamilyName) {
  const famMeta = `import type { FamilyMeta } from "../../types/tool";

export const meta: FamilyMeta = {
  id: ${JSON.stringify(family)},
  name: ${JSON.stringify(newFamilyName)},
  tagline: "A family of tiny mr tools.",
  description: ${JSON.stringify(`${newFamilyName} — tiny browser-only tools.`)},
  icon: "wrench",
};
`;
  if (!existsSync(familyDir)) mkdirSync(familyDir, { recursive: true });
  writeFileSync(join(familyDir, "_meta.ts"), famMeta);
  console.log(`created family ${familyDir}/_meta.ts`);
} else if (!existsSync(join(familyDir, "_meta.ts"))) {
  console.error(
    `family "${family}" has no _meta.ts — create it first or use --new-family`,
  );
  process.exit(1);
}

const toolDir = join(familyDir, slug);
if (existsSync(toolDir)) {
  console.error(`tool folder already exists: ${toolDir}`);
  process.exit(1);
}
mkdirSync(toolDir, { recursive: true });

writeFileSync(
  join(toolDir, "meta.ts"),
  `import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: ${JSON.stringify(slug)},
  name: ${JSON.stringify(displayName)},
  tagline: ${JSON.stringify(tagline)},
  description: ${JSON.stringify(`${displayName} — ${tagline}`)},
  tags: [],
  icon: "wrench",
  difficulty: "Easy",
  offline: true,
  related: [],
};
`,
);

writeFileSync(
  join(toolDir, "tool.ts"),
  `export function transform(input: string): string {
  return input;
}
`,
);

writeFileSync(
  join(toolDir, "index.astro"),
  `---
// ${displayName}
// Edit this page: input zone → actions → output.
// Use shared classes from src/styles/base.css and helpers from @/lib.
// Move any pure logic into ./tool.ts and cover it in ./test.ts.
---
<section class="stage">
  <label class="field">
    <span class="field-label">Input</span>
    <textarea class="input" rows="5" placeholder="Paste here…"></textarea>
  </label>
  <div class="actions">
    <button class="btn btn-primary" id="go">Transform</button>
  </div>
  <output class="output-box" id="out" aria-live="polite"></output>
</section>

<script>
  import { transform } from "./tool.ts";

  const input = document.querySelector<HTMLTextAreaElement>(".input");
  const out = document.querySelector<HTMLOutputElement>("#out");
  const go = document.querySelector<HTMLButtonElement>("#go");

  const run = () => {
    if (!input || !out) return;
    out.textContent = transform(input.value);
  };

  go?.addEventListener("click", run);
  input?.addEventListener("input", run);
</script>
`,
);

writeFileSync(
  join(toolDir, "test.ts"),
  `import { strictEqual } from "node:assert";
import { transform } from "./tool.ts";

export async function runTest() {
  strictEqual(transform("x"), "x", "transform passthrough");
}
`,
);

console.log(`scaffolded ${toolDir}`);
console.log(`next: edit meta.ts, tool.ts, index.astro, test.ts; then run: npm test`);

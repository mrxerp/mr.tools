import { strictEqual } from "node:assert";
import { parseMarkdown, blocksToPlainText, TEMPLATES } from "./tool.ts";

export async function runTest() {
  const md = `# Heading 1
## Heading 2

Paragraph with **bold** and *italic* text.

- List item 1
- List item 2

1. Ordered item
2. Another

> Blockquote

\`\`\`js
code block
\`\`\`

---`;

  const blocks = parseMarkdown(md);
  strictEqual(blocks.length > 0, true);
  strictEqual(blocks[0].type, "heading");
  strictEqual(blocks[0].level, 1);
  strictEqual(blocks[0].content, "Heading 1");

  const plain = blocksToPlainText(blocks);
  strictEqual(plain.includes("# Heading 1"), true);
  strictEqual(plain.includes("Paragraph with bold and italic text"), true);
  strictEqual(plain.includes("- List item 1"), true);

  strictEqual(TEMPLATES.length, 3);
  strictEqual(TEMPLATES[0].name, "Professional");
  strictEqual(TEMPLATES[1].name, "Academic");
  strictEqual(TEMPLATES[2].name, "Modern");
}
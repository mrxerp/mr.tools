import { strictEqual } from "node:assert";
import { fixFrontMatter, batchFix } from "./tool.ts";

export async function runTest() {
  const md = `---
title: "My Post"
date: "Jan 15, 2024"
tags: [Tag One, Tag Two]
---
Content here.`;
  const result = fixFrontMatter(md);
  strictEqual(result.fixed.includes('title: "My Post"'), true);
  strictEqual(result.fixed.includes("slug: my-post"), true);
  strictEqual(result.fixed.includes("date: 2024-01-15"), true);
  strictEqual(result.fixed.includes('tags: ["tag-one", "tag-two"]'), true);
  strictEqual(result.warnings.length > 0, true);
  strictEqual(result.suggestedFilename, "my-post.md");

  const md2 = `---
title: Another Post
date: 2024-06-20
---
Body.`;
  const result2 = fixFrontMatter(md2);
  strictEqual(result2.fixed.includes("slug: another-post"), true);
  strictEqual(result2.fixed.includes("date: 2024-06-20"), true);

  const md3 = `No front matter here.`;
  const result3 = fixFrontMatter(md3);
  strictEqual(result3.fixed, md3);
  strictEqual(result3.warnings[0], "No front matter found");

  const batch = batchFix([
    { name: "a.md", content: md },
    { name: "b.md", content: md2 },
  ]);
  strictEqual(batch.length, 2);
  strictEqual(batch[0].result.suggestedFilename, "my-post.md");
  strictEqual(batch[1].result.suggestedFilename, "another-post.md");
}
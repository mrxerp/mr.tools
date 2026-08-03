/**
 * run-tests.mjs - discovers every tool's test.ts below src/tools and runs each.
 *
 * Test contract: each test.ts exports `export async function runTest()`.
 * Throw an Error on failure. The runner reports per-file results and
 * exits non-zero if anything fails.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsRoot = join(root, "src", "tools");

const testFiles = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry === "test.ts") testFiles.push(full);
  }
}
walk(toolsRoot);

if (testFiles.length === 0) {
  console.log("[tests] no test.ts files found");
  process.exit(0);
}

let passed = 0;
const failures = [];

for (const file of testFiles) {
  const rel = file.replace(root + "/", "");
  try {
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.runTest !== "function") {
      throw new Error("test.ts must export async function runTest()");
    }
    await mod.runTest();
    passed++;
    console.log(`  ok   ${rel}`);
  } catch (err) {
    failures.push({ rel, err });
    console.error(`FAIL   ${rel}`);
    console.error(`       ${err.message}`);
  }
}

console.log(`[tests] ${passed}/${testFiles.length} passed`);
if (failures.length > 0) process.exit(1);

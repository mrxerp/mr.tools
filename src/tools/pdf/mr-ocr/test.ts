import { strictEqual } from "node:assert";
import { assemblePageText, cleanPageText } from "./tool.ts";

export async function runTest() {
  strictEqual(cleanPageText("  hello   world  "), "hello world");
  strictEqual(cleanPageText("  hello  \n  \n\n\nworld"), "hello\n\nworld");
  strictEqual(cleanPageText("   \n  \n"), "");
  strictEqual(cleanPageText(""), "");

  strictEqual(assemblePageText([{ str: "a" }, { str: "b", hasEOL: true }, { str: "c" }]), "ab\nc");
  strictEqual(assemblePageText([{ str: "a" }, { str: "b", hasEOL: true }]), "ab");
  strictEqual(assemblePageText([{ str: "hello" }, { str: " " }, { str: "world" }]), "hello world");
  strictEqual(assemblePageText([]), "");
  strictEqual(assemblePageText([{ hasEOL: true }]), "");
}

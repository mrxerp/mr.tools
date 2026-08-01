import { strictEqual, deepStrictEqual } from "node:assert";
import {
  buildPathTree,
  getPathForNode,
  evaluateJsonPath,
  evaluatePointer,
  tokenizeJsonPath,
  decodePointerPart,
} from "./tool.ts";

export async function runTest() {
  const data = {
    store: {
      book: [
        { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
        { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
      ],
      bicycle: { color: "red", price: 19.95 },
    },
  };

  // buildPathTree
  const tree = buildPathTree(data);
  strictEqual(tree.length, 1);
  strictEqual(tree[0].jsonPath, "$");
  strictEqual(tree[0].type, "object");

  // find store
  const storeNode = getPathForNode(tree, "$.store");
  strictEqual(storeNode?.type, "object");

  // find book array
  const bookNode = getPathForNode(tree, "$.store.book");
  strictEqual(bookNode?.type, "array");
  strictEqual(bookNode?.children?.length, 2);

  // evaluateJsonPath
  strictEqual(evaluateJsonPath(data, "$.store.bicycle.color"), "red");
  strictEqual(evaluateJsonPath(data, "$.store.book[0].author"), "Nigel Rees");
  strictEqual(evaluateJsonPath(data, "$.store.book[1].price"), 12.99);
  strictEqual(evaluateJsonPath(data, "$.nonexistent"), undefined);
  strictEqual(evaluateJsonPath(data, "$"), data);

  // tokenizeJsonPath
  deepStrictEqual(tokenizeJsonPath("$.store.book[0].author"), ["store", "book", 0, "author"]);
  deepStrictEqual(tokenizeJsonPath("$['special key']"), ["special key"]);
  deepStrictEqual(tokenizeJsonPath("$[0]"), [0]);

  // evaluatePointer
  strictEqual(evaluatePointer(data, "/store/bicycle/color"), "red");
  strictEqual(evaluatePointer(data, "/store/book/0/author"), "Nigel Rees");
  strictEqual(evaluatePointer(data, ""), data);
  strictEqual(evaluatePointer(data, "#"), data);
  strictEqual(evaluatePointer(data, "/nonexistent"), undefined);

  // decodePointerPart
  strictEqual(decodePointerPart("a~1b"), "a/b");
  strictEqual(decodePointerPart("a~0b"), "a~b");
  strictEqual(decodePointerPart("simple"), "simple");

  // Complex nested
  const complex = { a: { b: [{ c: 1 }, { c: 2 }] } };
  const tree2 = buildPathTree(complex);
  const c1 = getPathForNode(tree2, "$.a.b[0].c");
  strictEqual(c1?.value, 1);
}
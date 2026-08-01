import { strictEqual, deepStrictEqual } from "node:assert";
import {
  buildGrokTree,
  evaluateExpression,
  tokenize,
  getPage,
  flattenTree,
  searchTree,
  calculateSize,
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

  // buildGrokTree
  const result = buildGrokTree(data);
  strictEqual(result.tree.length, 1);
  strictEqual(result.tree[0].key, "$");
  strictEqual(result.tree[0].type, "object");
  strictEqual(result.nodeCount > 0, true);
  strictEqual(result.totalSize > 0, true);

  // evaluateExpression
  strictEqual(evaluateExpression(data, "$.store.bicycle.color").result, "red");
  strictEqual(evaluateExpression(data, "$.store.book[0].author").result, "Nigel Rees");
  strictEqual(evaluateExpression(data, "$.store.book[1].price").result, 12.99);
  strictEqual(evaluateExpression(data, "$").result, data);
  strictEqual(evaluateExpression(data, "$.nonexistent").result, undefined);

  // tokenize
  deepStrictEqual(tokenize("store.book[0].author"), ["store", "book", 0, "author"]);
  deepStrictEqual(tokenize("['special key']"), ["special key"]);
  deepStrictEqual(tokenize("[0]"), [0]);

  // getPage
  const flat = flattenTree(result.tree);
  const page1 = getPage(result.tree, 0, 2);
  strictEqual(page1.length, 2);

  // searchTree
  const searchResults = searchTree(result.tree, "author");
  strictEqual(searchResults.length >= 2, true);
  strictEqual(searchResults.every((n) => n.key === "author" || n.path.includes("author")), true);

  const searchResults2 = searchTree(result.tree, "fiction");
  strictEqual(searchResults2.length >= 1, true);

  // calculateSize
  strictEqual(calculateSize({ a: 1 }), JSON.stringify({ a: 1 }).length);
  strictEqual(calculateSize([1, 2, 3]), JSON.stringify([1, 2, 3]).length);

  // maxNodes limit
  const largeArray = Array.from({ length: 15000 }, (_, i) => ({ id: i }));
  const limited = buildGrokTree(largeArray, 1000);
  strictEqual(limited.nodeCount <= 1000, true);
}
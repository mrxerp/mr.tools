import { strictEqual } from "node:assert";
import { toCases } from "./tool.ts";

export async function runTest() {
  const cases = toCases("hello world");
  strictEqual(cases.length, 10, "ten case variants");
  strictEqual(cases.find((c) => c.name === "UPPERCASE")?.text, "HELLO WORLD");
  strictEqual(cases.find((c) => c.name === "camelCase")?.text, "helloWorld");
  strictEqual(cases.find((c) => c.name === "snake_case")?.text, "hello_world");
  strictEqual(cases.find((c) => c.name === "kebab-case")?.text, "hello-world");
  strictEqual(cases.find((c) => c.name === "Title Case")?.text, "Hello World");

  strictEqual(toCases("  so   much  space  ").find((c) => c.name === "UPPERCASE")?.text, "SO   MUCH  SPACE");
  strictEqual(toCases("  so   much  space  ").find((c) => c.name === "snake_case")?.text, "so_much_space");
  strictEqual(toCases("").length, 0, "empty input yields no cases");
}

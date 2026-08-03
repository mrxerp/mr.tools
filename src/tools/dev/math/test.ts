import { strictEqual, ok, throws } from "node:assert";
import { evaluate } from "./tool.ts";

export async function runTest() {
  strictEqual(evaluate("2 + 3 * 4"), 14, "operator precedence");
  strictEqual(evaluate("(2+3)*4"), 20, "parentheses");
  strictEqual(evaluate("2^10"), 1024, "power");
  strictEqual(evaluate("2^3^2"), 512, "power is right-associative");
  strictEqual(evaluate("-5 + 3"), -2, "unary minus");
  strictEqual(evaluate("sqrt(81)"), 9, "sqrt function");
  strictEqual(evaluate("min(3, 7)"), 3, "min function");
  ok(evaluate("pi") > 3.1415 && evaluate("pi") < 3.1416, "pi constant");
  strictEqual(evaluate("log(e)"), 1, "natural log of e");
  strictEqual(evaluate("abs(-4)"), 4, "abs function");
  strictEqual(evaluate("5 % 2"), 1, "modulo");
  throws(() => evaluate("1/0"), /zero/, "division by zero throws");
  throws(() => evaluate("2+"), "trailing operator throws");
  throws(() => evaluate("sqrt(-1)"), /negative/, "sqrt of negative throws");
  throws(() => evaluate("foo"), /Unknown/, "unknown identifier throws");
  throws(() => evaluate(""), /empty/, "empty input throws");
}

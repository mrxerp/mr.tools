import { strictEqual } from "node:assert";
import { expandContractions, formalize, formalizeWithStats, replaceSlang } from "./tool.ts";

export async function runTest() {
  strictEqual(expandContractions("I can't do it"), "I cannot do it");
  strictEqual(expandContractions("don't won't"), "do not will not");
  strictEqual(replaceSlang("gonna wanna kinda"), "going to want to kind of");

  strictEqual(
    formalize("hey, i can't come cuz i'm gonna be late"),
    "Hello, I cannot come because I am going to be late",
  );

  const s = formalizeWithStats("can't go now");
  strictEqual(s.contractions, 1);
  strictEqual(s.slang, 0);
  strictEqual(s.text, "Cannot go now");

  const s2 = formalizeWithStats("yeah man, that's cool");
  strictEqual(s2.slang, 1, "yeah swapped");
  strictEqual(s2.contractions, 1, "that's expanded");
  strictEqual(s2.text, "Yes man, that is cool");

  strictEqual(formalize("plain text"), "Plain text", "capitalizes start");
  strictEqual(expandContractions("no change"), "no change");
}

import { strictEqual } from "node:assert";
import {
  findMatches,
  explainTokens,
  getRecipes,
  suggestRecipe,
  validatePattern,
  escapeRegExp,
  generateFromSample,
} from "./tool.ts";

export async function runTest() {
  // findMatches
  const matches = findMatches("\\d+", "Order 123 and 456");
  strictEqual(matches.length, 2, "finds two digit groups");
  strictEqual(matches[0].match, "123", "first match");
  strictEqual(matches[0].index, 6, "first match index");
  strictEqual(matches[1].match, "456", "second match");
  strictEqual(matches[1].index, 14, "second match index");

  // Flags
  const caseMatches = findMatches("test", "TEST test", "i");
  strictEqual(caseMatches.length, 2, "case insensitive finds both");

  // Invalid pattern returns empty
  strictEqual(findMatches("[invalid", "test").length, 0, "invalid pattern returns empty");

  // explainTokens
  const tokens = explainTokens("\\d+");
  strictEqual(tokens.length >= 2, true, "explains tokens");
  const tokenTypes = tokens.map((t) => t.token);
  strictEqual(tokenTypes.includes("\\d"), true, "explains \\d");
  strictEqual(tokenTypes.includes("+"), true, "explains +");

  // getRecipes
  const recipes = getRecipes();
  strictEqual(recipes.length >= 8, true, "has common recipes");
  strictEqual(recipes.some((r) => r.name === "Email"), true, "has email recipe");
  strictEqual(recipes.some((r) => r.name === "UUID v4"), true, "has UUID recipe");

  // suggestRecipe
  const emailMatch = suggestRecipe("user@example.com");
  strictEqual(emailMatch?.name, "Email", "suggests email for email-like string");

  const noMatch = suggestRecipe("random text");
  strictEqual(noMatch, null, "returns null for no match");

  // validatePattern
  const valid = validatePattern("\\d+");
  strictEqual(valid.valid, true, "valid pattern");

  const invalid = validatePattern("[invalid");
  strictEqual(invalid.valid, false, "invalid pattern");
  strictEqual(typeof invalid.error, "string", "provides error message");

  // escapeRegExp
  strictEqual(escapeRegExp("hello.world"), "hello\\.world", "escapes dot");
  strictEqual(escapeRegExp("a+b*c?d"), "a\\+b\\*c\\?d", "escapes special chars");
  strictEqual(escapeRegExp("normal"), "normal", "leaves normal text alone");

  // generateFromSample
  strictEqual(generateFromSample("hello.world"), "hello\\.world", "generates escaped pattern");
}
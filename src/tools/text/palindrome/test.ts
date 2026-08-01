import { deepStrictEqual, strictEqual } from "node:assert";
import { anagramsOf, findPalindromes, isPalindrome } from "./tool.ts";

export async function runTest() {
  strictEqual(isPalindrome("racecar"), true);
  strictEqual(isPalindrome("hello"), false);
  strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true, "ignores case and punctuation");
  strictEqual(isPalindrome("a"), true, "single char");

  deepStrictEqual(
    findPalindromes("racecar civic radar hello noon"),
    ["racecar", "civic", "radar", "noon"],
  );
  deepStrictEqual(findPalindromes("nothing here"), [], "no palindromes");
  deepStrictEqual(findPalindromes("ab"), [], "minLen 3 filters shorts");

  deepStrictEqual(
    anagramsOf("listen", "enlist silent listen tinsel hello"),
    ["enlist", "silent", "tinsel"],
  );
  deepStrictEqual(anagramsOf("xyz", "abc def"), [], "no anagrams");
  deepStrictEqual(anagramsOf("", "anything"), [], "empty target");
}

import { strictEqual, throws } from "node:assert";
import { octalToSymbolic, symbolicToOctal } from "./tool.ts";

export async function runTest() {
  strictEqual(octalToSymbolic("644"), "rw-r--r--", "644");
  strictEqual(octalToSymbolic("755"), "rwxr-xr-x", "755");
  strictEqual(octalToSymbolic("4755"), "rwsr-xr-x", "setuid with execute");
  strictEqual(octalToSymbolic("6000"), "--S--S---", "setuid+setgid without execute");
  strictEqual(octalToSymbolic("7600"), "rwS--S--T", "all special bits without execute");

  strictEqual(symbolicToOctal("rw-r--r--"), "644", "symbolic to 644");
  strictEqual(symbolicToOctal("rwsr-xr-x"), "4755", "symbolic setuid");
  strictEqual(symbolicToOctal("rwS--S--T"), "7600", "symbolic special without execute");
  strictEqual(symbolicToOctal("-rwxr-xr-x"), "755", "10-char form ignores type char");

  throws(() => octalToSymbolic("9"), /octal/, "non-octal digit throws");
  throws(() => octalToSymbolic("12345"), /octal/, "too many digits throws");
  throws(() => symbolicToOctal("rwx"), /9/, "too few chars throws");
  throws(() => symbolicToOctal("rwqr--r--"), /invalid/, "invalid char throws");
}

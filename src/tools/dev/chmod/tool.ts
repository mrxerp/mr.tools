const SPECIAL_BITS = [4, 2, 1];
const SPECIAL_CHARS = ["s", "s", "t"];

export function octalToSymbolic(oct: string): string {
  if (typeof oct !== "string") {
    throw new Error("octal must be a string");
  }
  if (!/^[0-7]{3,4}$/.test(oct)) {
    throw new Error("octal must be 3 or 4 octal digits (0-7)");
  }
  let special = 0;
  let groups = oct;
  if (oct.length === 4) {
    special = Number(oct[0]);
    groups = oct.slice(1);
  }
  let out = "";
  for (let g = 0; g < 3; g++) {
    const digit = Number(groups[g]);
    const hasSpecial = (special & SPECIAL_BITS[g]) !== 0;
    out += digit & 4 ? "r" : "-";
    out += digit & 2 ? "w" : "-";
    if (hasSpecial) {
      out += digit & 1 ? SPECIAL_CHARS[g] : SPECIAL_CHARS[g].toUpperCase();
    } else {
      out += digit & 1 ? "x" : "-";
    }
  }
  return out;
}

export function symbolicToOctal(sym: string): string {
  if (typeof sym !== "string") {
    throw new Error("symbolic must be a string");
  }
  let s = sym;
  if (s.length === 10) {
    s = s.slice(1);
  }
  if (s.length !== 9) {
    throw new Error("symbolic must be 9 characters (or 10 with a leading file-type char)");
  }
  let special = 0;
  let out = "";
  for (let g = 0; g < 3; g++) {
    const r = s[g * 3];
    const w = s[g * 3 + 1];
    const x = s[g * 3 + 2];
    if ((r !== "r" && r !== "-") || (w !== "w" && w !== "-")) {
      throw new Error(`invalid symbolic string "${sym}"`);
    }
    if (!["x", "-", "s", "S", "t", "T"].includes(x)) {
      throw new Error(`invalid symbolic string "${sym}"`);
    }
    let digit = 0;
    if (r === "r") digit += 4;
    if (w === "w") digit += 2;
    if (x === "x" || x === "s" || x === "t") digit += 1;
    if (x === "s" || x === "S" || x === "t" || x === "T") {
      special += SPECIAL_BITS[g];
    }
    out += digit;
  }
  return special === 0 ? out : String(special) + out;
}

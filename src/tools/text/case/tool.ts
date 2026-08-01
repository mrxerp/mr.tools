export interface CaseResult {
  name: string;
  text: string;
}

export function toCases(input: string): CaseResult[] {
  if (!input) return [];
  const trimmed = input.trim();
  return [
    { name: "UPPERCASE", text: trimmed.toUpperCase() },
    { name: "lowercase", text: trimmed.toLowerCase() },
    {
      name: "Sentence case",
      text: trimmed
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase()),
    },
    {
      name: "Title Case",
      text: trimmed.toLowerCase().replace(
        /\b\w/g,
        (m, i, s) => (i === 0 || /[-\s("']/.test(s[i - 1] ?? "") ? m.toUpperCase() : m),
      ),
    },
    { name: "camelCase", text: toCamel(trimmed) },
    { name: "PascalCase", text: capitalize(toCamel(trimmed)) },
    { name: "snake_case", text: toWords(trimmed).join("_").toLowerCase() },
    { name: "kebab-case", text: toWords(trimmed).join("-").toLowerCase() },
    { name: "UPPER_SNAKE", text: toWords(trimmed).join("_").toUpperCase() },
    { name: "flatcase", text: toWords(trimmed).join("").toLowerCase() },
  ];
}

function toWords(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toCamel(s: string): string {
  const words = toWords(s);
  if (words.length === 0) return "";
  return words[0].toLowerCase() + words.slice(1).map(capitalize).join("");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

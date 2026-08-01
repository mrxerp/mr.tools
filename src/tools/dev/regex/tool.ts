// RegexRaptor: Sample-driven regex builder

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export interface TokenExplanation {
  token: string;
  description: string;
}

export interface RegexRecipe {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

const COMMON_RECIPES: RegexRecipe[] = [
  {
    name: "Email",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    description: "Standard email address format",
    example: "user@example.com",
  },
  {
    name: "URL (HTTP/HTTPS)",
    pattern: "^https?://[^\\s/$.?#].[^\\s]*$",
    description: "HTTP or HTTPS URL",
    example: "https://example.com/path",
  },
  {
    name: "IPv4 Address",
    pattern: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "IPv4 address (0.0.0.0 - 255.255.255.255)",
    example: "192.168.1.1",
  },
  {
    name: "UUID v4",
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    description: "UUID version 4",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  {
    name: "ISO 8601 Date",
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "YYYY-MM-DD date format",
    example: "2024-01-15",
  },
  {
    name: "ISO 8601 DateTime",
    pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?(?:Z|[+-]\\d{2}:\\d{2})?$",
    description: "ISO 8601 datetime with optional timezone",
    example: "2024-01-15T10:30:00Z",
  },
  {
    name: "Hex Color",
    pattern: "^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$",
    description: "3 or 6 digit hex color",
    example: "#ff5500 or ff5500",
  },
  {
    name: "Credit Card (Luhn-ready)",
    pattern: "^\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}$",
    description: "16-digit credit card with optional separators",
    example: "4111-1111-1111-1111",
  },
  {
    name: "Phone (US)",
    pattern: "^\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$",
    description: "US phone number formats",
    example: "(555) 123-4567 or 555-123-4567",
  },
  {
    name: "Semantic Version",
    pattern: "^v?\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?(?:\\+[\\w.]+)?$",
    description: "SemVer (major.minor.patch with optional pre-release/build)",
    example: "1.2.3 or v2.0.0-beta.1",
  },
];

const TOKEN_EXPLANATIONS: Record<string, string> = {
  "\\d": "Any digit (0-9)",
  "\\D": "Any non-digit",
  "\\w": "Word character (a-z, A-Z, 0-9, _)",
  "\\W": "Non-word character",
  "\\s": "Whitespace (space, tab, newline)",
  "\\S": "Non-whitespace",
  ".": "Any character except newline",
  "^": "Start of string/line",
  "$": "End of string/line",
  "\\b": "Word boundary",
  "\\B": "Non-word boundary",
  "*": "Zero or more (greedy)",
  "+": "One or more (greedy)",
  "?": "Zero or one (greedy)",
  "*?": "Zero or more (lazy)",
  "+?": "One or more (lazy)",
  "??": "Zero or one (lazy)",
  "{n}": "Exactly n times",
  "{n,}": "n or more times",
  "{n,m}": "Between n and m times",
  "[abc]": "Character class: a, b, or c",
  "[^abc]": "Negated character class: not a, b, or c",
  "[a-z]": "Range: a through z",
  "(abc)": "Capturing group",
  "(?:abc)": "Non-capturing group",
  "(?<name>abc)": "Named capturing group",
  "(?=abc)": "Positive lookahead",
  "(?!abc)": "Negative lookahead",
  "(?<=abc)": "Positive lookbehind",
  "(?<!abc)": "Negative lookbehind",
  "a|b": "Alternation: a or b",
  "\\\\": "Escape special character",
};

export function findMatches(pattern: string, text: string, flags: string = ""): RegexMatch[] {
  try {
    const regex = new RegExp(pattern, flags + "g");
    const matches: RegexMatch[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        match: match[0],
        index: match.index,
        groups: match.slice(1),
      });
      if (match[0].length === 0) break; // Prevent infinite loop on zero-width matches
    }
    return matches;
  } catch {
    return [];
  }
}

export function explainTokens(pattern: string): TokenExplanation[] {
  const tokens: TokenExplanation[] = [];
  let i = 0;
  while (i < pattern.length) {
    let matched = false;
    // Check for multi-char tokens first (sorted by length descending)
    const sortedTokens = Object.keys(TOKEN_EXPLANATIONS).sort((a, b) => b.length - a.length);
    for (const token of sortedTokens) {
      if (pattern.startsWith(token, i)) {
        tokens.push({ token, description: TOKEN_EXPLANATIONS[token] });
        i += token.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Single character fallback
      const char = pattern[i];
      const desc = TOKEN_EXPLANATIONS[char] || `Literal character: "${char}"`;
      tokens.push({ token: char, description: desc });
      i++;
    }
  }
  return tokens;
}

export function getRecipes(): RegexRecipe[] {
  return COMMON_RECIPES;
}

export function suggestRecipe(text: string): RegexRecipe | null {
  for (const recipe of COMMON_RECIPES) {
    try {
      const regex = new RegExp(recipe.pattern);
      if (regex.test(text)) {
        return recipe;
      }
    } catch {
      // Invalid pattern, skip
    }
  }
  return null;
}

export function validatePattern(pattern: string, flags: string = ""): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern, flags);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Invalid regex" };
  }
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateFromSample(sample: string): string {
  // Simple heuristic: escape the sample and suggest making parts flexible
  return escapeRegExp(sample);
}
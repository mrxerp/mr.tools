export interface ScraperResult {
  markdown: string;
  warnings: string[];
}

const JUNK_PATTERNS = [
  /^.*?(cookie|consent|gdpr|privacy|subscribe|newsletter|sign up).*$/gmi,
  /^.*?(advertisement|sponsored|promoted).*$/gmi,
  /^.*?(share|follow us|social media|facebook|twitter|instagram).*$/gmi,
  /^\s*(related|more from|you may also like).*$/gmi,
  /^\s*\d+\s*(min|minute|sec|second)\s*(read|ago).*$/gmi,
];

const WHITESPACE_COLLAPSE = /\s+/g;
const MULTIPLE_NEWLINES = /\n{3,}/g;
const LEADING_TRAILING_SPACES = /^[ \t]+|[ \t]+$/gm;

export function cleanMarkdown(input: string): ScraperResult {
  const warnings: string[] = [];
  let text = input;

  // Remove junk lines
  for (const pattern of JUNK_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      warnings.push(`Removed ${matches.length} junk line(s)`);
      text = text.replace(pattern, "");
    }
  }

  // Fix line breaks: join wrapped lines, preserve paragraphs
  text = text.replace(/([^.!?])\n([a-z])/g, "$1 $2");
  text = text.replace(/\n{2,}/g, "\n\n");

  // Normalize headings: lines that look like headings
  text = text.replace(/^([A-Z][^.!?]{10,80})\n\n/gm, "# $1\n\n");
  text = text.replace(/^(\d+\.\s+[A-Z][^.!?]{10,80})\n\n/gm, "## $1\n\n");

  // Normalize quotes
  text = text.replace(/“|”/g, '"');
  text = text.replace(/‘|’/g, "'");
  text = text.replace(/^>\s*(.+)$/gm, "> $1");

  // Fix bullet points
  text = text.replace(/^[\s•·▪▫]\s*/gm, "- ");
  text = text.replace(/^(\d+)[.)]\s+/gm, "$1. ");

  // Collapse excessive whitespace
  text = text.replace(MULTIPLE_NEWLINES, "\n\n");
  text = text.replace(WHITESPACE_COLLAPSE, " ");
  text = text.replace(LEADING_TRAILING_SPACES, "");
  text = text.trim();

  // Ensure proper paragraph spacing
  text = text.replace(/\n\n+/g, "\n\n");

  return { markdown: text, warnings };
}

export function extractArticle(text: string): ScraperResult {
  const warnings: string[] = [];
  let content = text;

  // Try to find main content by removing common boilerplate
  const boilerplate = [
    /^.*?(header|nav|menu|sidebar|footer).*$/gmi,
    /^.*?(skip to|jump to).*$/gmi,
    /^.*?(search|login|register|account).*$/gmi,
  ];

  for (const pattern of boilerplate) {
    content = content.replace(pattern, "");
  }

  return cleanMarkdown(content);
}
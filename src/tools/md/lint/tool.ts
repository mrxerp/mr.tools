export interface LintIssue {
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: "error" | "warning" | "info";
  fixable: boolean;
  fix?: (lines: string[]) => string[];
}

export interface LintResult {
  issues: LintIssue[];
  fixed?: string;
}

const RULES = {
  headingHierarchy: { name: "heading-hierarchy", severity: "error" as const },
  lineLength: { name: "line-length", severity: "warning" as const, max: 100 },
  trailingSpaces: { name: "trailing-spaces", severity: "warning" as const },
  noDuplicateHeading: { name: "no-duplicate-heading", severity: "warning" as const },
  linkValidity: { name: "link-validity", severity: "info" as const },
  noEmptyLinks: { name: "no-empty-links", severity: "error" as const },
  noMissingAlt: { name: "no-missing-alt", severity: "warning" as const },
};

export function lintMarkdown(markdown: string, fix = false): LintResult {
  const lines = markdown.split("\n");
  const issues: LintIssue[] = [];
  let fixedLines = [...lines];
  let lastHeadingLevel = 0;
  const headingTexts = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Heading hierarchy
    const headingMatch = line.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level > lastHeadingLevel + 1 && lastHeadingLevel > 0) {
        issues.push({
          line: lineNum,
          column: 1,
          rule: RULES.headingHierarchy.name,
          message: `Heading level jumps from h${lastHeadingLevel} to h${level}`,
          severity: RULES.headingHierarchy.severity,
          fixable: false,
        });
      }
      lastHeadingLevel = level;

      const text = line.replace(/^#+\s*/, "").trim();
      if (headingTexts.has(text.toLowerCase())) {
        issues.push({
          line: lineNum,
          column: 1,
          rule: RULES.noDuplicateHeading.name,
          message: `Duplicate heading: "${text}"`,
          severity: RULES.noDuplicateHeading.severity,
          fixable: false,
        });
      }
      headingTexts.add(text.toLowerCase());
    }

    // Line length
    if (line.length > RULES.lineLength.max) {
      issues.push({
        line: lineNum,
        column: RULES.lineLength.max + 1,
        rule: RULES.lineLength.name,
        message: `Line exceeds ${RULES.lineLength.max} characters (${line.length})`,
        severity: RULES.lineLength.severity,
        fixable: false,
      });
    }

    // Trailing spaces
    if (line.endsWith(" ")) {
      issues.push({
        line: lineNum,
        column: line.length,
        rule: RULES.trailingSpaces.name,
        message: "Trailing spaces",
        severity: RULES.trailingSpaces.severity,
        fixable: true,
        fix: (ls) => ls.map((l) => l.replace(/\s+$/, "")),
      });
    }

    // Empty links
    if (/\[\]\(\)/.test(line) || /\[([^\]]*)\]\(\s*\)/.test(line)) {
      issues.push({
        line: lineNum,
        column: line.indexOf("[]") + 1,
        rule: RULES.noEmptyLinks.name,
        message: "Empty link",
        severity: RULES.noEmptyLinks.severity,
        fixable: false,
      });
    }

    // Missing alt text
    if (/!\[\]\(/.test(line)) {
      issues.push({
        line: lineNum,
        column: line.indexOf("![]") + 1,
        rule: RULES.noMissingAlt.name,
        message: "Missing alt text for image",
        severity: RULES.noMissingAlt.severity,
        fixable: false,
      });
    }

    // Link validity (basic check)
    const linkMatches = [...line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
    for (const match of linkMatches) {
      const url = match[2];
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("#") && !url.startsWith("/") && !url.startsWith("./") && !url.startsWith("../")) {
        issues.push({
          line: lineNum,
          column: line.indexOf(match[0]) + 1,
          rule: RULES.linkValidity.name,
          message: `Link may be invalid: ${url}`,
          severity: RULES.linkValidity.severity,
          fixable: false,
        });
      }
    }
  }

  let fixed: string | undefined;
  if (fix) {
    const fixableIssues = issues.filter((i) => i.fixable && i.fix);
    for (const issue of fixableIssues) {
      if (issue.fix) {
        fixedLines = issue.fix(fixedLines);
      }
    }
    fixed = fixedLines.join("\n");
  }

  return { issues, fixed };
}
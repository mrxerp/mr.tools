export interface LintOptions {
  expectedColumns?: number;
  delimiter?: string;
  strictQuoting: boolean;
}

export interface LintIssue {
  line: number;
  column?: number;
  code: string;
  message: string;
  severity: "error" | "warning";
  context: string;
}

export interface LintResult {
  issues: LintIssue[];
  stats: {
    totalLines: number;
    validRows: number;
    issuesFound: number;
    errors: number;
    warnings: number;
  };
  headers: string[];
  sampleRows: string[][];
}

function parseCSVLines(text: string, delimiter: string): { headers: string[]; rows: string[][]; lineNumbers: number[]; unmatchedQuoteLines: number[] } {
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  const lineNumbers: number[] = [];
  const unmatchedQuoteLines: number[] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let lineNum = 1;

  for (const line of lines) {
    let j = 0;
    let rowStartLine = lineNum;
    let lineQuoteCount = 0;
    let lineInQuotes = false;
    while (j < line.length) {
      const ch = line[j];
      if (ch === '"') {
        if (lineInQuotes && j + 1 < line.length && line[j + 1] === '"') {
          j += 2;
          continue;
        }
        lineInQuotes = !lineInQuotes;
        lineQuoteCount++;
        j++;
      } else {
        j++;
      }
    }
    if (lineQuoteCount % 2 !== 0) {
      unmatchedQuoteLines.push(lineNum);
    }

    j = 0;
    while (j < line.length) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"';
          j += 2;
          continue;
        }
        inQuotes = !inQuotes;
        j++;
      } else if (ch === delimiter && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
        j++;
      } else {
        currentField += ch;
        j++;
      }
    }
    if (!inQuotes) {
      currentRow.push(currentField);
      rows.push(currentRow);
      lineNumbers.push(rowStartLine);
      currentRow = [];
      currentField = "";
      lineNum++;
    } else {
      currentField += "\n";
      lineNum++;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
    lineNumbers.push(lineNum);
  }

  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  const dataLineNumbers = lineNumbers.slice(1);
  return { headers, rows: dataRows, lineNumbers: dataLineNumbers, unmatchedQuoteLines };
}

export function lintCSV(input: string, options: LintOptions = { strictQuoting: true }): LintResult {
  const delimiter = options.delimiter || detectDelimiter(input);
  const issues: LintIssue[] = [];
  let warnings = 0;
  let errors = 0;

  const { headers, rows, lineNumbers, unmatchedQuoteLines } = parseCSVLines(input, delimiter);
  const expectedCols = options.expectedColumns ?? headers.length;

  if (rows.length === 0) {
    issues.push({
      line: 1,
      code: "EMPTY_FILE",
      message: "CSV contains only header row, no data",
      severity: "warning",
      context: headers.join(delimiter),
    });
    warnings++;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = lineNumbers[i];
    const context = row.slice(0, 5).join(delimiter) + (row.length > 5 ? "..." : "");

    if (row.length !== expectedCols) {
      issues.push({
        line: lineNum,
        code: row.length > expectedCols ? "EXTRA_COLUMNS" : "MISSING_COLUMNS",
        message: `Row has ${row.length} columns, expected ${expectedCols}`,
        severity: "error",
        context,
      });
      errors++;
    }

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];

      if (options.strictQuoting) {
        if (cell.includes(delimiter) || cell.includes("\n") || cell.includes("\r")) {
          if (!cell.startsWith('"') || !cell.endsWith('"')) {
            issues.push({
              line: lineNum,
              column: c + 1,
              code: "MISSING_QUOTES",
              message: `Field contains delimiter or newline but is not quoted`,
              severity: "warning",
              context: cell.slice(0, 50),
            });
            warnings++;
          }
        }
      }

      if (cell.includes('""')) {
        if (!cell.startsWith('"') || !cell.endsWith('"')) {
          issues.push({
            line: lineNum,
            column: c + 1,
            code: "INVALID_ESCAPE",
            message: `Double quotes found outside quoted field`,
            severity: "warning",
            context: cell.slice(0, 50),
          });
          warnings++;
        }
      }
    }
  }

  for (const lineNum of unmatchedQuoteLines) {
    if (lineNum > 1) { // Skip header line
      issues.push({
        line: lineNum,
        code: "UNMATCHED_QUOTE",
        message: `Unmatched quote on line ${lineNum}`,
        severity: "error",
        context: input.split(/\r?\n/)[lineNum - 1]?.slice(0, 50) || "",
      });
      errors++;
    }
  }

  const totalLines = input.split(/\r?\n/).length;
  return {
    issues,
    stats: {
      totalLines,
      validRows: rows.length - errors,
      issuesFound: issues.length,
      errors,
      warnings,
    },
    headers,
    sampleRows: rows.slice(0, 10),
  };
}

function detectDelimiter(text: string): string {
  const delimiters = [",", "\t", ";", "|"];
  const firstLine = text.split(/\r?\n/)[0] || "";
  let bestDelim = ",";
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > maxCount) { maxCount = count; bestDelim = d; }
  }
  return bestDelim;
}

export function generateReport(result: LintResult): string {
  const lines: string[] = [];
  lines.push("CSV LINT REPORT");
  lines.push("=".repeat(40));
  lines.push(`Total lines: ${result.stats.totalLines}`);
  lines.push(`Valid data rows: ${result.stats.validRows}`);
  lines.push(`Issues found: ${result.stats.issuesFound} (${result.stats.errors} errors, ${result.stats.warnings} warnings)`);
  lines.push(`Expected columns: ${result.headers.length}`);
  lines.push("");

  if (result.issues.length > 0) {
    lines.push("ISSUES:");
    lines.push("-".repeat(40));
    for (const issue of result.issues) {
      const col = issue.column ? `, col ${issue.column}` : "";
      lines.push(`${issue.severity.toUpperCase()} [${issue.code}] Line ${issue.line}${col}: ${issue.message}`);
      lines.push(`  Context: ${issue.context}`);
    }
  } else {
    lines.push("No issues found. CSV is valid!");
  }

  return lines.join("\n");
}
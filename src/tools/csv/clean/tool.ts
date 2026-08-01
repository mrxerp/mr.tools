export interface CleanOptions {
  trimWhitespace: boolean;
  dedupeRows: boolean;
  fixLineEndings: boolean;
  normalizeDelimiter: boolean;
  normalizeQuoting: boolean;
  delimiter?: string;
}

export interface CleanResult {
  csv: string;
  originalRowCount: number;
  cleanedRowCount: number;
  removedRows: number;
  changes: string[];
}

export interface ParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

function detectDelimiter(text: string): string {
  const delimiters = [",", "\t", ";", "|"];
  const firstLine = text.split(/\r?\n/)[0] || "";
  let bestDelim = ",";
  let maxCount = 0;
  for (const d of delimiters) {
    const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelim = d;
    }
  }
  return bestDelim;
}

function parseCSV(text: string, delimiter: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    let j = 0;
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
      currentRow = [];
      currentField = "";
      i++;
    } else {
      currentField += "\n";
      i++;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  return { headers, rows: dataRows, delimiter };
}

function stringifyCSV(headers: string[], rows: string[][], delimiter: string): string {
  const escape = (field: string) => {
    if (field.includes(delimiter) || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  };
  const lines = [headers.map(escape).join(delimiter)];
  for (const row of rows) {
    lines.push(row.map(escape).join(delimiter));
  }
  return lines.join("\n");
}

export function cleanCSV(input: string, options: CleanOptions = {
  trimWhitespace: true,
  dedupeRows: true,
  fixLineEndings: true,
  normalizeDelimiter: true,
  normalizeQuoting: true,
}): CleanResult {
  const changes: string[] = [];
  let csv = input;

  if (options.fixLineEndings) {
    csv = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    changes.push("Fixed line endings (normalized to LF)");
  }

  const delimiter = options.delimiter || detectDelimiter(csv);
  if (options.normalizeDelimiter && delimiter !== ",") {
    changes.push(`Normalized delimiter from '${delimiter === "\t" ? "tab" : delimiter}' to comma`);
  }

  const parsed = parseCSV(csv, delimiter);
  let { headers, rows } = parsed;

  if (options.trimWhitespace) {
    let trimmedCount = 0;
    rows = rows.map(row => row.map(cell => {
      const trimmed = cell.trim();
      if (trimmed !== cell) trimmedCount++;
      return trimmed;
    }));
    headers = headers.map(h => h.trim());
    if (trimmedCount > 0) changes.push(`Trimmed whitespace from ${trimmedCount} cells`);
  }

  if (options.dedupeRows) {
    const seen = new Set<string>();
    const uniqueRows: string[][] = [];
    let removed = 0;
    for (const row of rows) {
      const key = row.join("\t");
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      } else {
        removed++;
      }
    }
    rows = uniqueRows;
    if (removed > 0) changes.push(`Removed ${removed} duplicate row${removed === 1 ? "" : "s"}`);
  }

  const outputDelimiter = options.normalizeDelimiter ? "," : delimiter;
  const outputCsv = stringifyCSV(headers, rows, outputDelimiter);

  if (options.normalizeQuoting) {
    changes.push("Normalized quoting (minimal RFC 4180)");
  }

  return {
    csv: outputCsv,
    originalRowCount: parsed.rows.length + 1,
    cleanedRowCount: rows.length + 1,
    removedRows: parsed.rows.length - rows.length,
    changes,
  };
}
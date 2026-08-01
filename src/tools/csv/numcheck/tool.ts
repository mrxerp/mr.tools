export interface NumCheckOptions {
  detectNumericColumns: boolean;
  normalizeCurrency: boolean;
  normalizePercent: boolean;
  detectOutliers: boolean;
  outlierThreshold: number;
}

export interface Anomaly {
  row: number;
  col: number;
  colName: string;
  value: string;
  type: "non-numeric" | "currency" | "percent" | "outlier";
  message: string;
  suggestedFix?: string;
}

export interface NumCheckResult {
  headers: string[];
  rows: string[][];
  anomalies: Anomaly[];
  numericColumns: number[];
  stats: {
    totalCells: number;
    numericCells: number;
    anomaliesFound: number;
    fixed: number;
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

function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text);
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
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') { currentField += '"'; j += 2; continue; }
        inQuotes = !inQuotes; j++;
      } else if (ch === delimiter && !inQuotes) { currentRow.push(currentField); currentField = ""; j++; }
      else { currentField += ch; j++; }
    }
    if (!inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ""; i++; }
    else { currentField += "\n"; i++; }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
  return rows;
}

function stringifyCSV(headers: string[], rows: string[][]): string {
  const escape = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) { lines.push(row.map(escape).join(",")); }
  return lines.join("\n");
}

function isNumericColumn(colValues: string[], threshold = 0.8): boolean {
  let numericCount = 0;
  let total = 0;
  for (const v of colValues) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    total++;
    if (/^-?[\d,]+\.?\d*$/.test(trimmed.replace(/,/g, "")) ||
        /^-?\$?[\d,]+\.?\d*$/.test(trimmed) ||
        /^-?[\d,]+\.?\d*%$/.test(trimmed)) {
      numericCount++;
    }
  }
  return total > 0 && numericCount / total >= threshold;
}

function parseNumber(value: string): { num: number | null; clean: string; type: "plain" | "currency" | "percent" | "invalid" } {
  const trimmed = value.trim();
  if (!trimmed) return { num: null, clean: "", type: "invalid" };

  if (/^-?\$?[\d,]+\.?\d*$/.test(trimmed)) {
    const clean = trimmed.replace(/[\$,]/g, "");
    return { num: Number(clean), clean, type: "currency" };
  }
  if (/^-?[\d,]+\.?\d*%$/.test(trimmed)) {
    const clean = trimmed.replace(/[%,]/g, "");
    return { num: Number(clean) / 100, clean: clean + "%", type: "percent" };
  }
  if (/^-?[\d,]+\.?\d*$/.test(trimmed.replace(/,/g, ""))) {
    const clean = trimmed.replace(/,/g, "");
    return { num: Number(clean), clean, type: "plain" };
  }
  return { num: null, clean: trimmed, type: "invalid" };
}

function detectOutliers(values: number[], threshold = 3): boolean[] {
  if (values.length < 4) return values.map(() => false);
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - threshold * iqr;
  const upper = q3 + threshold * iqr;
  return values.map(v => v < lower || v > upper);
}

export async function checkNumbers(
  input: string | Uint8Array,
  isXlsx: boolean,
  options: NumCheckOptions
): Promise<NumCheckResult> {
  let headers: string[];
  let rows: string[][];

  if (isXlsx) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(input, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
    headers = data[0] || [];
    rows = data.slice(1);
  } else {
    const text = typeof input === "string" ? input : new TextDecoder().decode(input);
    const data = parseCSV(text);
    headers = data[0] || [];
    rows = data.slice(1);
  }

  const anomalies: Anomaly[] = [];
  const numericColumns: number[] = [];
  let fixed = 0;

  for (let c = 0; c < headers.length; c++) {
    const colValues = rows.map(r => r[c] || "");
    const isNumeric = isNumericColumn(colValues);

    if (!isNumeric) continue;
    numericColumns.push(c);

    const parsed = colValues.map((v, r) => ({ ...parseNumber(v), row: r }));
    const validNumbers = parsed.filter(p => p.num !== null).map(p => p.num!);

    if (options.detectOutliers && validNumbers.length > 3) {
      const outlierFlags = detectOutliers(validNumbers, options.outlierThreshold);
      let outlierIdx = 0;
      for (const p of parsed) {
        if (p.num !== null) {
          if (outlierFlags[outlierIdx]) {
            anomalies.push({
              row: p.row, col: c, colName: headers[c], value: p.clean,
              type: "outlier", message: `Outlier detected (IQR method)`,
              suggestedFix: String(p.num),
            });
          }
          outlierIdx++;
        }
      }
    }

    for (const p of parsed) {
      if (p.num === null && p.clean) {
        anomalies.push({
          row: p.row, col: c, colName: headers[c], value: p.clean,
          type: "non-numeric", message: `Non-numeric value in numeric column`,
          suggestedFix: "",
        });
      } else if (p.type === "currency" && options.normalizeCurrency) {
        anomalies.push({
          row: p.row, col: c, colName: headers[c], value: p.clean,
          type: "currency", message: `Currency format normalized`,
          suggestedFix: String(p.num),
        });
        fixed++;
      } else if (p.type === "percent" && options.normalizePercent) {
        anomalies.push({
          row: p.row, col: c, colName: headers[c], value: p.clean,
          type: "percent", message: `Percent format normalized`,
          suggestedFix: String(p.num),
        });
        fixed++;
      }
    }
  }

  const cleanedRows = rows.map((row, r) =>
    row.map((cell, c) => {
      const anomaly = anomalies.find(a => a.row === r && a.col === c && a.suggestedFix !== undefined);
      return anomaly ? anomaly.suggestedFix! : cell;
    })
  );

  return {
    headers,
    rows: cleanedRows,
    anomalies,
    numericColumns,
    stats: {
      totalCells: rows.length * headers.length,
      numericCells: numericColumns.length * rows.length,
      anomaliesFound: anomalies.length,
      fixed,
    },
  };
}

export function generateReport(result: NumCheckResult): string {
  const lines: string[] = [];
  lines.push("NUMERIC DATA QUALITY REPORT");
  lines.push("=".repeat(40));
  lines.push(`Numeric columns detected: ${result.numericColumns.map(i => result.headers[i]).join(", ") || "none"}`);
  lines.push(`Total cells: ${result.stats.totalCells}`);
  lines.push(`Numeric cells: ${result.stats.numericCells}`);
  lines.push(`Anomalies found: ${result.stats.anomaliesFound}`);
  lines.push(`Auto-fixed: ${result.stats.fixed}`);
  lines.push("");

  if (result.anomalies.length > 0) {
    lines.push("ANOMALIES:");
    lines.push("-".repeat(40));
    const byType = new Map<string, Anomaly[]>();
    for (const a of result.anomalies) {
      if (!byType.has(a.type)) byType.set(a.type, []);
      byType.get(a.type)!.push(a);
    }
    for (const [type, items] of byType) {
      lines.push(`\n${type.toUpperCase()} (${items.length}):`);
      for (const a of items.slice(0, 50)) {
        const fix = a.suggestedFix ? ` → ${a.suggestedFix}` : "";
        lines.push(`  Row ${a.row + 1}, ${a.colName}: "${a.value}"${fix}`);
      }
      if (items.length > 50) lines.push(`  ... and ${items.length - 50} more`);
    }
  }

  return lines.join("\n");
}
export type AggFunc = "sum" | "count" | "avg" | "min" | "max";

export interface PivotConfig {
  rows: string[];
  cols: string[];
  values: { field: string; agg: AggFunc }[];
}

export interface PivotResult {
  headers: string[];
  rows: (string | number)[][];
  config: PivotConfig;
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

function toNumber(v: string): number | null {
  const trimmed = v.trim().replace(/[$,%]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return isNaN(n) ? null : n;
}

export async function buildPivot(
  input: string | Uint8Array,
  isXlsx: boolean,
  config: PivotConfig
): Promise<PivotResult> {
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

  const rowIndices = config.rows.map(f => headers.indexOf(f)).filter(i => i >= 0);
  const colIndices = config.cols.map(f => headers.indexOf(f)).filter(i => i >= 0);
  const valueIndices = config.values.map(v => headers.indexOf(v.field)).filter(i => i >= 0);

  if (rowIndices.length === 0 && colIndices.length === 0) {
    throw new Error("Select at least one row or column field");
  }
  if (valueIndices.length === 0) {
    throw new Error("Select at least one value field");
  }

  const rowGroups = new Map<string, number[]>();
  const colGroups = new Map<string, number[]>();

  for (let r = 0; r < rows.length; r++) {
    const rowKey = rowIndices.map(i => rows[r][i] || "").join("|");
    const colKey = colIndices.map(i => rows[r][i] || "").join("|");
    if (!rowGroups.has(rowKey)) rowGroups.set(rowKey, []);
    rowGroups.get(rowKey)!.push(r);
    if (!colGroups.has(colKey)) colGroups.set(colKey, []);
    colGroups.get(colKey)!.push(r);
  }

  const rowKeys = Array.from(rowGroups.keys()).sort();
  const colKeys = Array.from(colGroups.keys()).sort();
  const hasColFields = config.cols.length > 0;

  const pivotRows: (string | number)[][] = [];
  const outHeaders: string[] = [...config.rows];

  if (hasColFields) {
    for (const colKey of colKeys) {
      for (const v of config.values) {
        outHeaders.push(`${colKey === "" ? "Total" : colKey} - ${v.field} (${v.agg})`);
      }
    }
  } else {
    for (const v of config.values) {
      outHeaders.push(`${v.field} (${v.agg})`);
    }
  }

  for (const rowKey of rowKeys) {
    const rowIndicesList = rowGroups.get(rowKey)!;
    const outRow: (string | number)[] = rowKey.split("|");

    if (!hasColFields) {
      for (const v of config.values) {
        const vi = headers.indexOf(v.field);
        const values = rowIndicesList.map(r => toNumber(rows[r][vi] || "")).filter(x => x !== null);
        outRow.push(aggregate(values, v.agg));
      }
    } else {
      for (const colKey of colKeys) {
        const colIndicesList = colGroups.get(colKey)!;
        const intersect = rowIndicesList.filter(r => colIndicesList.includes(r));
        for (const v of config.values) {
          const vi = headers.indexOf(v.field);
          const values = intersect.map(r => toNumber(rows[r][vi] || "")).filter(x => x !== null);
          outRow.push(aggregate(values, v.agg));
        }
      }
    }
    pivotRows.push(outRow);
  }

  if (rowKeys.length > 1) {
    const grandTotal: (string | number)[] = ["Grand Total"];
    for (let c = config.rows.length; c < outHeaders.length; c++) {
      const colValues = pivotRows.map(r => typeof r[c] === "number" ? r[c] : 0).filter(x => typeof x === "number");
      grandTotal.push(colValues.length > 0 ? colValues.reduce((a, b) => a + b, 0) : 0);
    }
    pivotRows.push(grandTotal);
  }

  return { headers: outHeaders, rows: pivotRows, config };
}

function aggregate(values: number[], func: AggFunc): number {
  if (values.length === 0) return 0;
  switch (func) {
    case "sum": return values.reduce((a, b) => a + b, 0);
    case "count": return values.length;
    case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
    case "min": return Math.min(...values);
    case "max": return Math.max(...values);
  }
}

export function pivotToCSV(result: PivotResult): string {
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [result.headers.map(escape).join(",")];
  for (const row of result.rows) { lines.push(row.map(escape).join(",")); }
  return lines.join("\n");
}

export async function pivotToXLSX(result: PivotResult): Promise<Uint8Array> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([result.headers, ...result.rows.map(r => r.map(String))]);
  XLSX.utils.book_append_sheet(wb, ws, "Pivot");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
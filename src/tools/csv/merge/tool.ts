export type MergeMode = "concat" | "union" | "intersect";
export type DedupMode = "none" | "first" | "last";

export interface MergeOptions {
  mode: MergeMode;
  keyColumns: string[];
  dedup: DedupMode;
  includeHeader: boolean;
  outputFormat: "csv" | "xlsx";
}

export interface MergeResult {
  headers: string[];
  rows: string[][];
  totalInputRows: number;
  outputRows: number;
  removedDuplicates: number;
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
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          currentField += '"'; j += 2; continue;
        }
        inQuotes = !inQuotes; j++;
      } else if (ch === delimiter && !inQuotes) {
        currentRow.push(currentField); currentField = ""; j++;
      } else { currentField += ch; j++; }
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
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

export async function mergeSpreadsheets(
  inputs: Array<{ data: string | Uint8Array; isXlsx: boolean; name: string }>,
  options: MergeOptions
): Promise<MergeResult> {
  const allData: Array<{ headers: string[]; rows: string[][] }> = [];
  let totalInputRows = 0;

  for (const input of inputs) {
    let headers: string[];
    let rows: string[][];

    if (input.isXlsx) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(input.data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
      headers = data[0] || [];
      rows = data.slice(1);
    } else {
      const text = typeof input.data === "string" ? input.data : new TextDecoder().decode(input.data);
      const data = parseCSV(text);
      headers = data[0] || [];
      rows = data.slice(1);
    }
    allData.push({ headers, rows });
    totalInputRows += rows.length;
  }

  if (allData.length === 0) throw new Error("No files to merge");

  const referenceHeaders = allData[0].headers;
  const keyIndices = options.keyColumns.map(k => referenceHeaders.indexOf(k)).filter(i => i >= 0);

  let mergedRows: string[][] = [];

  if (options.mode === "concat") {
    for (const { headers, rows } of allData) {
      const aligned = alignRows(rows, headers, referenceHeaders);
      mergedRows.push(...aligned);
    }
  } else {
    const rowMap = new Map<string, string[]>();
    const rowCount = new Map<string, number>();

    for (const { headers, rows } of allData) {
      const aligned = alignRows(rows, headers, referenceHeaders);
      for (const row of aligned) {
        const key = keyIndices.length > 0 ? keyIndices.map(i => row[i]).join("|") : row.join("|");
        const existing = rowMap.get(key);
        if (!existing) {
          rowMap.set(key, row);
          rowCount.set(key, 1);
        } else {
          rowCount.set(key, (rowCount.get(key) || 0) + 1);
          if (options.mode === "union" && options.dedup === "last") {
            rowMap.set(key, row);
          }
        }
      }
    }

    if (options.mode === "intersect" && allData.length > 1) {
      const keyCounts = new Map<string, number>();
      for (const { headers, rows } of allData) {
        const aligned = alignRows(rows, headers, referenceHeaders);
        const seen = new Set<string>();
        for (const row of aligned) {
          const key = keyIndices.length > 0 ? keyIndices.map(i => row[i]).join("|") : row.join("|");
          if (!seen.has(key)) {
            seen.add(key);
            keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
          }
        }
      }
      const requiredCount = allData.length;
      mergedRows = Array.from(rowMap.entries())
        .filter(([key]) => (keyCounts.get(key) || 0) === requiredCount)
        .map(([, row]) => row);
    } else {
      mergedRows = Array.from(rowMap.values());
    }
  }

  let removedDuplicates = 0;
  if (options.dedup !== "none" && keyIndices.length > 0) {
    const seen = new Map<string, number>();
    const uniqueRows: string[][] = [];
    for (let i = 0; i < mergedRows.length; i++) {
      const row = mergedRows[i];
      const key = keyIndices.map(idx => row[idx]).join("|");
      if (!seen.has(key)) {
        seen.set(key, i);
        uniqueRows.push(row);
      } else {
        removedDuplicates++;
        if (options.dedup === "last") {
          uniqueRows[seen.get(key)!] = row;
        }
      }
    }
    mergedRows = uniqueRows;
  }

  return {
    headers: referenceHeaders,
    rows: mergedRows,
    totalInputRows,
    outputRows: mergedRows.length,
    removedDuplicates,
  };
}

function alignRows(rows: string[][], sourceHeaders: string[], targetHeaders: string[]): string[][] {
  const indexMap = targetHeaders.map(h => sourceHeaders.indexOf(h));
  return rows.map(row => indexMap.map(i => i >= 0 ? (row[i] || "") : ""));
}

export async function mergeToXLSX(result: MergeResult): Promise<Uint8Array> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([result.headers, ...result.rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Merged");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
export interface SortFilter {
  column: string;
  operator: "eq" | "ne" | "contains" | "greater" | "less" | "starts-with" | "ends-with";
  value: string;
}

export interface SortOptions {
  sortBy: { column: string; direction: "asc" | "desc" }[];
  filters: SortFilter[];
  reorderColumns: string[];
  includeHeader: boolean;
}

export interface SortResult {
  headers: string[];
  rows: string[][];
  originalRows: string[][];
  stats: {
    totalRows: number;
    filteredRows: number;
    sortKeys: string[];
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

function compareValues(a: any, b: any, desc: boolean): number {
  if (a === b) return 0;
  if (a === "" || a === null) return 1;
  if (b === "" || b === null) return -1;

  const numA = Number(a);
  const numB = Number(b);

  if (!isNaN(numA) && !isNaN(numB)) {
    return desc ? numB - numA : numA - numB;
  }

  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return desc ? strB.localeCompare(strA) : strA.localeCompare(strB);
}

export function sortAndFilter(input: string, options: SortOptions): SortResult {
  const data = parseCSV(input);
  const headers = data[0] || [];
  const originalRows = data.slice(1);
  let rows = originalRows.map(row => [...row]);

  const columnIndexMap = new Map<string, number>();
  for (let i = 0; i < headers.length; i++) {
    columnIndexMap.set(headers[i], i);
  }

  for (const filter of options.filters) {
    const colIdx = columnIndexMap.get(filter.column);
    if (colIdx === undefined) continue;
    rows = rows.filter(row => {
      const val = row[colIdx] || "";
      switch (filter.operator) {
        case "eq": return val === filter.value;
        case "ne": return val !== filter.value;
        case "contains": return val.toLowerCase().includes(filter.value.toLowerCase());
        case "greater": {
          const num = Number(val);
          return !isNaN(num) && num > Number(filter.value);
        }
        case "less": {
          const num = Number(val);
          return !isNaN(num) && num < Number(filter.value);
        }
        case "starts-with": return val.toLowerCase().startsWith(filter.value.toLowerCase());
        case "ends-with": return val.toLowerCase().endsWith(filter.value.toLowerCase());
        default: return true;
      }
    });
  }

  const sortKeys: string[] = [];
  if (options.sortBy.length > 0) {
    rows.sort((a, b) => {
      let result = 0;
      for (const { column, direction } of options.sortBy) {
        const colIdx = columnIndexMap.get(column);
        if (colIdx === undefined) continue;
        const valA = a[colIdx] || "";
        const valB = b[colIdx] || "";
        result = compareValues(valA, valB, direction === "desc");
        if (result !== 0) break;
      }
      return result;
    });
    sortKeys.push(...options.sortBy.map(s => `${s.column} (${s.direction})`));
  }

  if (options.reorderColumns.length > 0) {
    const newHeaders = [...options.reorderColumns];
    const newRows = rows.map(row => {
      const reordered: string[] = [];
      for (const col of newHeaders) {
        const idx = columnIndexMap.get(col);
        reordered.push(idx !== undefined ? row[idx] || "" : "");
      }
      return reordered;
    });
    headers.length = 0;
    headers.push(...newHeaders);
    rows = newRows;
  }

  return {
    headers,
    rows,
    originalRows,
    stats: {
      totalRows: originalRows.length,
      filteredRows: rows.length,
      sortKeys,
    },
  };
}

export function generateSortPreview(result: SortResult): string {
  return stringifyCSV(result.headers, result.rows);
}
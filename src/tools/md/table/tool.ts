export interface TableCell {
  value: string;
  align?: "left" | "center" | "right";
}

export interface TableData {
  rows: TableCell[][];
  headers: string[];
  alignments: ("left" | "center" | "right")[];
}

export function parseMarkdownTable(md: string): TableData | null {
  const lines = md.trim().split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const headerCells = parseRow(lines[0]);
  const alignLine = lines[1];
  const alignments = parseRow(alignLine).map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });

  const rows: TableCell[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    rows.push(
      cells.map((value, idx) => ({
        value,
        align: alignments[idx] || "left",
      })),
    );
  }

  return { headers: headerCells, alignments, rows };
}

export function generateMarkdownTable(data: TableData): string {
  const { headers, alignments, rows } = data;
  const cols = headers.length;

  const headerRow = "| " + headers.map((h, i) => pad(h, cols, i)).join(" | ") + " |";
  const alignRow =
    "| " +
    alignments
      .map((a, i) => {
        const w = colWidth(headers, rows, i);
        if (a === "center") return ":" + "-".repeat(w - 2) + ":";
        if (a === "right") return "-".repeat(w - 1) + ":";
        return ":" + "-".repeat(w - 1);
      })
      .join(" | ") +
    " |";

  const bodyRows = rows.map((row) =>
    "| " + row.map((c, i) => pad(c.value, cols, i)).join(" | ") + " |",
  );

  return [headerRow, alignRow, ...bodyRows].join("\n");
}

function colWidth(headers: string[], rows: TableCell[][], idx: number): number {
  let w = headers[idx]?.length || 3;
  for (const row of rows) w = Math.max(w, row[idx]?.value.length || 0);
  return Math.max(w, 3) + 2;
}

function pad(text: string, _cols: number, idx: number): string {
  return text.padEnd(colWidth([], [], idx) - 2);
}

export function parseCSV(csv: string): TableData {
  const lines = csv.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCSVLine(line);
    return headers.map((_, i) => ({ value: cells[i] || "", align: "left" as const }));
  });
  return { headers, alignments: headers.map(() => "left"), rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function tableToCSV(data: TableData): string {
  const escape = (s: string) => (s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [data.headers.map(escape).join(",")];
  for (const row of data.rows) lines.push(row.map((c) => escape(c.value)).join(","));
  return lines.join("\n");
}
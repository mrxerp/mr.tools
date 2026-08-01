// JsonPorter: JSON filter, query, and transform utilities

export interface JsonPathResult {
  path: string;
  value: unknown;
}

export interface TableColumn {
  key: string;
  header: string;
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`);
  }
}

export function stringifyJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

function jsonPathQuery(obj: unknown, path: string): JsonPathResult[] {
  // Simple JSONPath subset implementation
  // Supports: $, .key, ['key'], [index], [*], ..key (recursive)
  const results: JsonPathResult[] = [];

  function normalizePath(p: string): string[] {
    // Convert JSONPath to array of path segments
    const segments: string[] = [];
    let current = "";
    let inBracket = false;
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < p.length; i++) {
      const char = p[i];
      if (!inBracket && char === ".") {
        if (current) {
          segments.push(current);
          current = "";
        }
      } else if (char === "[" && !inQuote) {
        inBracket = true;
        if (current) {
          segments.push(current);
          current = "";
        }
      } else if (char === "]" && !inQuote) {
        inBracket = false;
        if (current) {
          segments.push(current);
          current = "";
        }
      } else if ((char === "'" || char === '"') && !inQuote) {
        inQuote = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = "";
        current += char;
      } else {
        current += char;
      }
    }
    if (current) segments.push(current);
    return segments.filter((s) => s !== "$" && s !== "");
  }

  function evaluate(node: unknown, segments: string[], currentPath: string): void {
    if (segments.length === 0) {
      results.push({ path: currentPath || "$", value: node });
      return;
    }

    const segment = segments[0];
    const remaining = segments.slice(1);

    if (segment === "*") {
      // Wildcard - all properties/elements
      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          evaluate(item, remaining, `${currentPath}[${index}]`);
        });
      } else if (node && typeof node === "object") {
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
          evaluate(value, remaining, `${currentPath}.${key}`);
        });
      }
    } else if (segment === "..") {
      // Recursive descent - handled at higher level
    } else if (segment.startsWith("'") || segment.startsWith('"')) {
      // Quoted key
      const key = segment.slice(1, -1);
      if (node && typeof node === "object" && key in (node as Record<string, unknown>)) {
        evaluate(
          (node as Record<string, unknown>)[key],
          remaining,
          `${currentPath}.${key}`,
        );
      }
    } else if (/^\d+$/.test(segment)) {
      // Array index
      const index = parseInt(segment, 10);
      if (Array.isArray(node) && index < node.length) {
        evaluate(node[index], remaining, `${currentPath}[${index}]`);
      }
    } else {
      // Property key
      if (node && typeof node === "object" && segment in (node as Record<string, unknown>)) {
        evaluate(
          (node as Record<string, unknown>)[segment],
          remaining,
          `${currentPath}.${segment}`,
        );
      }
    }
  }

  function recursiveDescent(node: unknown, segments: string[], currentPath: string): void {
    // Check current node
    evaluate(node, segments, currentPath);

    // Recurse into children
    if (node && typeof node === "object") {
      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          recursiveDescent(item, segments, `${currentPath}[${index}]`);
        });
      } else {
        Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
          recursiveDescent(value, segments, `${currentPath}.${key}`);
        });
      }
    }
  }

  const segments = normalizePath(path);

  // Handle recursive descent (..)
  if (segments.includes("..")) {
    const startIdx = segments.indexOf("..");
    const prefix = segments.slice(0, startIdx);
    const suffix = segments.slice(startIdx + 1);

    // First navigate to prefix
    let node = obj;
    let prefixPath = "$";
    for (const seg of prefix) {
      if (seg === "*") break;
      if (seg.startsWith("'") || seg.startsWith('"')) {
        const key = seg.slice(1, -1);
        if (node && typeof node === "object" && key in (node as Record<string, unknown>)) {
          node = (node as Record<string, unknown>)[key];
          prefixPath += `.${key}`;
        } else {
          return;
        }
      } else if (/^\d+$/.test(seg)) {
        const index = parseInt(seg, 10);
        if (Array.isArray(node) && index < node.length) {
          node = node[index];
          prefixPath += `[${index}]`;
        } else {
          return;
        }
      } else {
        if (node && typeof node === "object" && seg in (node as Record<string, unknown>)) {
          node = (node as Record<string, unknown>)[seg];
          prefixPath += `.${seg}`;
        } else {
          return;
        }
      }
    }

    // Now recursive descent on remaining
    recursiveDescent(node, suffix, prefixPath);
  } else {
    evaluate(obj, segments, "$");
  }

  return results;
}

export function queryJsonPath(json: unknown, path: string): JsonPathResult[] {
  if (!path || path === "$") {
    return [{ path: "$", value: json }];
  }
  return jsonPathQuery(json, path);
}

export function jsonToCsv(json: unknown): string {
  if (!Array.isArray(json)) {
    // Single object - convert to array
    if (json && typeof json === "object") {
      return jsonToCsv([json]);
    }
    return "";
  }

  if (json.length === 0) return "";

  // Flatten objects for CSV
  function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flatten(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  const flattened = json.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return flatten(item as Record<string, unknown>);
    }
    return { value: item };
  });

  // Collect all unique keys
  const allKeys = new Set<string>();
  for (const row of flattened) {
    Object.keys(row).forEach((k) => allKeys.add(k));
  }
  const headers = Array.from(allKeys);

  // Generate CSV
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [headers.join(",")];
  for (const row of flattened) {
    rows.push(headers.map((h) => escape(row[h])).join(","));
  }

  return rows.join("\n");
}

export function getTableColumns(json: unknown): TableColumn[] {
  if (!Array.isArray(json) || json.length === 0) return [];

  const first = json[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) {
    return [{ key: "value", header: "Value" }];
  }

  function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        keys.push(...extractKeys(value as Record<string, unknown>, newKey));
      } else {
        keys.push(newKey);
      }
    }
    return keys;
  }

  const allKeys = new Set<string>();
  for (const item of json.slice(0, 100)) {
    // Sample first 100
    if (item && typeof item === "object" && !Array.isArray(item)) {
      extractKeys(item as Record<string, unknown>).forEach((k) => allKeys.add(k));
    }
  }

  return Array.from(allKeys).map((key) => ({ key, header: key }));
}

export function formatJsonValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

export function filterJson(json: unknown, filterFn: (value: unknown) => boolean): unknown {
  if (Array.isArray(json)) {
    return json.filter(filterFn);
  }
  if (json && typeof json === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
      if (filterFn(value)) {
        result[key] = value;
      }
    }
    return result;
  }
  return filterFn(json) ? json : null;
}
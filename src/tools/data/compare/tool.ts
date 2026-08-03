export type DiffMode = "structural" | "literal";
export type InputFormat = "json" | "yaml" | "xml";

export interface DiffOptions {
  mode: DiffMode;
  format: InputFormat;
}

export interface DiffResult {
  same: boolean;
  differences: DiffEntry[];
  leftOnly: string[];
  rightOnly: string[];
}

export interface DiffEntry {
  path: string;
  type: "added" | "removed" | "changed" | "type-changed";
  leftValue?: unknown;
  rightValue?: unknown;
  leftType?: string;
  rightType?: string;
}

export interface ParseResult {
  data: unknown;
  error?: string;
}

export function parseInput(input: string, format: InputFormat): ParseResult {
  try {
    switch (format) {
      case "json":
        return { data: JSON.parse(input) };
      case "yaml":
        return { data: parseYaml(input) };
      case "xml":
        return { data: parseXml(input) };
      default:
        return { data: null, error: `Unknown format: ${format}` };
    }
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

function parseYaml(input: string): unknown {
  // Simple YAML subset parser for common cases
  // This is a minimal implementation - for production, use js-yaml
  const lines = input.split("\n");
  const stack: Array<{ indent: number; obj: Record<string, unknown> }> = [
    { indent: -1, obj: {} },
  ];
  let currentObj = stack[0].obj;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const [key, ...rest] = trimmed.split(":");
    const value = rest.join(":").trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    currentObj = stack[stack.length - 1].obj;

    if (value === "" || value === "{}") {
      currentObj[key.trim()] = {};
      stack.push({ indent, obj: currentObj[key.trim()] as Record<string, unknown> });
    } else if (value.startsWith("[") && value.endsWith("]")) {
      currentObj[key.trim()] = parseYamlArray(value);
    } else {
      currentObj[key.trim()] = parseYamlValue(value);
    }
  }
  return stack[0].obj;
}

function parseYamlArray(value: string): unknown[] {
  const content = value.slice(1, -1).trim();
  if (!content) return [];
  return content.split(",").map((v) => parseYamlValue(v.trim()));
}

function parseYamlValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseXml(input: string): unknown {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(parseError.textContent || "XML parse error");
  return xmlToJson(doc.documentElement);
}

function xmlToJson(element: Element): unknown {
  const obj: Record<string, unknown> = {};

  if (element.attributes.length > 0) {
    obj["@attributes"] = {};
    for (const attr of element.attributes) {
      (obj["@attributes"] as Record<string, string>)[attr.name] = attr.value;
    }
  }

  const children = Array.from(element.children);
  if (children.length === 0) {
    const text = element.textContent?.trim();
    if (text) obj["#text"] = text;
  } else {
    const groups: Record<string, Element[]> = {};
    for (const child of children) {
      if (!groups[child.tagName]) groups[child.tagName] = [];
      groups[child.tagName].push(child);
    }

    for (const [tag, elements] of Object.entries(groups)) {
      if (elements.length === 1) {
        obj[tag] = xmlToJson(elements[0]);
      } else {
        obj[tag] = elements.map(xmlToJson);
      }
    }
  }
  return obj;
}

export function diff(left: unknown, right: unknown, _mode: DiffMode): DiffResult {
  const differences: DiffEntry[] = [];
  const leftKeys = new Set<string>();
  const rightKeys = new Set<string>();

  collectPaths(left, "", leftKeys);
  collectPaths(right, "", rightKeys);

  const allPaths = new Set([...leftKeys, ...rightKeys]);

  for (const path of allPaths) {
    const leftVal = getValueAtPath(left, path);
    const rightVal = getValueAtPath(right, path);
    const leftExists = leftKeys.has(path);
    const rightExists = rightKeys.has(path);

    if (!leftExists && rightExists) {
      differences.push({ path, type: "added", rightValue: rightVal, rightType: getType(rightVal) });
    } else if (leftExists && !rightExists) {
      differences.push({ path, type: "removed", leftValue: leftVal, leftType: getType(leftVal) });
    } else {
      // Both exist - check if values differ
      const leftIsObject = leftVal !== null && typeof leftVal === "object";
      const rightIsObject = rightVal !== null && typeof rightVal === "object";
      
      if (!deepEqual(leftVal, rightVal)) {
        // Only report changes for primitive values, not for objects/arrays
        // (object/array differences are reflected in their children)
        if (!leftIsObject && !rightIsObject) {
          differences.push({
            path,
            type: "changed",
            leftValue: leftVal,
            rightValue: rightVal,
            leftType: getType(leftVal),
            rightType: getType(rightVal),
          });
        }
      }
    }
  }

  const leftOnly = [...leftKeys].filter((k) => !rightKeys.has(k)).sort();
  const rightOnly = [...rightKeys].filter((k) => !leftKeys.has(k)).sort();

  return {
    same: differences.length === 0,
    differences,
    leftOnly,
    rightOnly,
  };
}

export function collectPaths(obj: unknown, prefix: string, set: Set<string>): void {
  if (obj === null || obj === undefined) {
    if (prefix) set.add(prefix);
    return;
  }
  if (typeof obj !== "object") {
    set.add(prefix);
    return;
  }
  if (Array.isArray(obj)) {
    if (prefix) set.add(prefix);
    obj.forEach((v, i) => collectPaths(v, `${prefix}[${i}]`, set));
  } else {
    if (prefix) set.add(prefix);
    for (const [k, v] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${k}` : k;
      collectPaths(v, newPrefix, set);
    }
  }
}

export function getValueAtPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  const parts = path.split(/[.\[\]]+/).filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[parseInt(part, 10)];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== (b as unknown[]).length) return false;
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function formatDiffResult(result: DiffResult): string {
  if (result.same) return "No differences found.";
  const lines = [`Differences: ${result.differences.length}`];
  for (const d of result.differences) {
    const left = d.leftValue !== undefined ? JSON.stringify(d.leftValue) : "(absent)";
    const right = d.rightValue !== undefined ? JSON.stringify(d.rightValue) : "(absent)";
    lines.push(`  ${d.path}: ${d.type} - ${left} → ${right}`);
  }
  if (result.leftOnly.length) lines.push(`Left only: ${result.leftOnly.join(", ")}`);
  if (result.rightOnly.length) lines.push(`Right only: ${result.rightOnly.join(", ")}`);
  return lines.join("\n");
}
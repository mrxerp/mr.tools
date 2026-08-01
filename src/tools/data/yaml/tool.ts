export interface YamlResult {
  valid: boolean;
  data?: unknown;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
  json?: string;
  yaml?: string;
  warnings?: string[];
}

export interface ConvertOptions {
  indent?: number;
  quotingStyle?: "double" | "single" | "minimal";
}

const YAML_TYPE_TAGS = new Set([
  "!!str",
  "!!int",
  "!!float",
  "!!bool",
  "!!null",
  "!!timestamp",
  "!!seq",
  "!!map",
]);

export function parseYaml(input: string): YamlResult {
  if (!input.trim()) {
    return { valid: true, data: null, yaml: "" };
  }

  try {
    const data = parseYamlInternal(input);
    const warnings = checkYamlQuoting(input);
    return {
      valid: true,
      data,
      yaml: input.trim(),
      json: JSON.stringify(data, null, 2),
      warnings: warnings.length ? warnings : undefined,
    };
  } catch (e) {
    const error = e as Error & { mark?: { line: number; column: number } };
    return {
      valid: false,
      error: {
        message: error.message,
        line: error.mark?.line,
        column: error.mark?.column,
      },
    };
  }
}

function parseYamlInternal(input: string): unknown {
  const lines = input.split("\n");
  const stack: Array<{ indent: number; value: unknown; key?: string }> = [];
  let root: unknown = null;
  let currentParent: Record<string, unknown> | unknown[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const [key, ...rest] = trimmed.split(":");
    const value = rest.join(":").trim();

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (value === "" || value === "{}") {
      const newObj: Record<string, unknown> = {};
      if (stack.length === 0) {
        root = newObj;
        currentParent = newObj;
      } else {
        const parent = stack[stack.length - 1];
        if (Array.isArray(parent.value)) {
          (parent.value as unknown[]).push(newObj);
        } else if (parent.key !== undefined) {
          (parent.value as Record<string, unknown>)[parent.key] = newObj;
        }
      }
      stack.push({ indent, value: newObj });
    } else if (value.startsWith("- ")) {
      const itemValue = parseYamlValue(value.slice(2).trim());
      if (stack.length === 0) {
        const newArr = [itemValue];
        root = newArr;
        currentParent = newArr;
        stack.push({ indent, value: newArr });
      } else {
        const parent = stack[stack.length - 1];
        if (!Array.isArray(parent.value)) {
          const newArr: unknown[] = [];
          if (parent.key !== undefined) {
            (parent.value as Record<string, unknown>)[parent.key] = newArr;
          } else if (stack.length === 1) {
            root = newArr;
          }
          parent.value = newArr;
        }
        (parent.value as unknown[]).push(itemValue);
        if (isComplexValue(value.slice(2).trim())) {
          stack.push({ indent: indent + 1, value: itemValue });
        }
      }
    } else {
      const parsedValue = parseYamlValue(value);
      if (stack.length === 0) {
        const newObj = { [key.trim()]: parsedValue };
        root = newObj;
        currentParent = newObj;
        stack.push({ indent, value: newObj, key: key.trim() });
      } else {
        const parent = stack[stack.length - 1];
        if (Array.isArray(parent.value)) {
          (parent.value as unknown[]).push({ [key.trim()]: parsedValue });
        } else {
          (parent.value as Record<string, unknown>)[key.trim()] = parsedValue;
        }
      }
    }
  }

  return root;
}

function parseYamlValue(value: string): unknown {
  if (value === "true" || value === "True" || value === "TRUE") return true;
  if (value === "false" || value === "False" || value === "FALSE") return false;
  if (value === "null" || value === "Null" || value === "NULL" || value === "~") return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  if (/^0o[0-7]+$/i.test(value)) return parseInt(value.slice(2), 8);
  if (/^0x[0-9a-f]+$/i.test(value)) return parseInt(value.slice(2), 16);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return value;
}

function isComplexValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "{}";
}

export function stringifyYaml(data: unknown, options: ConvertOptions = {}): string {
  const { indent = 2 } = options;
  return stringifyYamlInternal(data, "", indent);
}

function stringifyYamlInternal(data: unknown, currentIndent: string, indentSize: number): string {
  if (data === null) return "null";
  if (data === undefined) return "";
  if (typeof data === "string") {
    if (needsQuoting(data)) {
      return `"${escapeString(data)}"`;
    }
    return data;
  }
  if (typeof data === "number" || typeof data === "boolean") return String(data);
  if (Array.isArray(data)) {
    if (data.length === 0) return "[]";
    const nextIndent = currentIndent + " ".repeat(indentSize);
    return (
      "\n" +
      data
        .map((item) => {
          const itemStr = stringifyYamlInternal(item, nextIndent, indentSize);
          return `${nextIndent}- ${itemStr.trimStart()}`;
        })
        .join("\n")
    );
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const nextIndent = currentIndent + " ".repeat(indentSize);
    return (
      "\n" +
      entries
        .map(([key, value]) => {
          const valueStr = stringifyYamlInternal(value, nextIndent, indentSize);
          return `${nextIndent}${needsQuoting(key) ? `"${escapeString(key)}"` : key}: ${valueStr.trimStart()}`;
        })
        .join("\n")
    );
  }
  return String(data);
}

function needsQuoting(str: string): boolean {
  if (!str) return true;
  if (/^["'`@&*!|>%{}[\]?,:]$/.test(str)) return true;
  if (/[\n\r\t]/.test(str)) return true;
  if (/^[-?~]/.test(str)) return true;
  if (/[:#{}[]&*!|>'"`%@]/.test(str)) return true;
  if (/^\d+$/.test(str)) return true;
  if (/^(true|false|null|~|\+|\-|\.|\d+\.\d+)$/i.test(str)) return true;
  return false;
}

function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

export function convertJsonToYaml(jsonInput: string, options: ConvertOptions = {}): YamlResult {
  try {
    const data = JSON.parse(jsonInput);
    const yaml = stringifyYaml(data, options);
    const warnings = checkJsonQuotingSafety(jsonInput);
    return { valid: true, data, yaml, json: jsonInput, warnings: warnings.length ? warnings : undefined };
  } catch (e) {
    const error = e as SyntaxError;
    return {
      valid: false,
      error: { message: error.message },
    };
  }
}

export function convertYamlToJson(yamlInput: string, options: ConvertOptions = {}): YamlResult {
  const parsed = parseYaml(yamlInput);
  if (!parsed.valid) return parsed;
  const indent = options.indent ?? 2;
  return { ...parsed, json: JSON.stringify(parsed.data, null, indent) };
}

function checkYamlQuoting(input: string): string[] {
  const warnings: string[] = [];
  const lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const value = line.slice(colonIdx + 1).trim();
    if (!value) continue;
    if (
      /^\d{1,2}:\d{2}$/.test(value) &&
      !value.startsWith('"') &&
      !value.startsWith("'")
    ) {
      warnings.push(`Line ${i + 1}: "${value}" looks like a timestamp but is unquoted — will be parsed as string`);
    }
    if (
      /^(yes|no|on|off)$/i.test(value) &&
      !value.startsWith('"') &&
      !value.startsWith("'")
    ) {
      warnings.push(`Line ${i + 1}: "${value}" looks like a boolean but is unquoted — will be parsed as string`);
    }
  }
  return warnings;
}

function checkJsonQuotingSafety(jsonInput: string): string[] {
  const warnings: string[] = [];
  try {
    const data = JSON.parse(jsonInput);
    const jsonStr = JSON.stringify(data);
    const reparsed = JSON.parse(jsonStr);
    if (!deepEqual(data, reparsed)) {
      warnings.push("Round-trip JSON parse/stringify changed the data — check for precision loss");
    }
  } catch {
    // ignore
  }
  return warnings;
}

function deepEqual(a: unknown, b: unknown): boolean {
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

export function lintYaml(input: string): YamlResult {
  return parseYaml(input);
}
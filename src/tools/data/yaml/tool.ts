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
  // Each entry records where a value lives (owner[key]) and the value itself,
  // so object children fill the container while sequence children replace it.
  const stack: Array<{ indent: number; owner: Record<string, unknown> | unknown[]; key: string | number; value: unknown; container: boolean }> = [];
  let root: Record<string, unknown> | unknown[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const isSequenceItem = trimmed.startsWith("- ");

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length > 0 && indent > stack[stack.length - 1].indent && !stack[stack.length - 1].container) {
      throw Object.assign(new Error("Bad indentation: children cannot nest under a scalar value"), {
        mark: { line: i + 1, column: indent + 1 },
      });
    }

    if (isSequenceItem) {
      const itemText = trimmed.slice(2).trim();
      const itemValue = parseYamlValue(itemText);
      if (stack.length === 0) {
        const newArr = [itemValue];
        root = newArr;
        stack.push({ indent, owner: newArr, key: 0, value: newArr, container: true });
      } else {
        const top = stack[stack.length - 1];
        let arr: unknown[];
        if (Array.isArray(top.value)) {
          arr = top.value;
        } else {
          arr = [];
          if (Array.isArray(top.owner)) {
            top.owner[top.key as number] = arr;
          } else {
            top.owner[top.key as string] = arr;
          }
          stack[stack.length - 1] = { ...top, value: arr, container: true };
        }
        arr.push(itemValue);
        if (isComplexValue(itemText)) {
          const idx = arr.length - 1;
          arr[idx] = {};
          stack.push({ indent: indent + 1, owner: arr, key: idx, value: arr[idx], container: true });
        }
      }
    } else {
      const [key, ...rest] = trimmed.split(":");
      const value = rest.join(":").trim();
      const keyName = key.trim();
      const isComplex = isComplexValue(value);
      const parsedValue = isComplex ? {} : parseYamlValue(value);

      let owner: Record<string, unknown> | unknown[];
      if (stack.length === 0) {
        if (root && !Array.isArray(root)) {
          owner = root;
        } else {
          const newObj = { [keyName]: parsedValue };
          root = newObj;
          owner = newObj;
        }
      } else {
        const top = stack[stack.length - 1];
        if (Array.isArray(top.value)) {
          const item = { [keyName]: parsedValue };
          top.value.push(item);
          owner = item;
        } else {
          owner = top.value as Record<string, unknown>;
        }
      }
      owner[keyName] = parsedValue;
      stack.push({ indent, owner, key: keyName, value: parsedValue, container: isComplex });
    }
  }

  return root;
}

function parseYamlValue(value: string): unknown {
  if (/[[\]{}]/.test(value)) {
    let depth = 0;
    for (const ch of value) {
      if (ch === "[" || ch === "{") depth++;
      else if (ch === "]" || ch === "}") depth--;
    }
    if (depth !== 0) throw new Error("Unbalanced brackets in value");
  }
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
  if (/[:#{}[\]&*!|>'"`%@]/.test(str)) return true;
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

export function checkYamlQuoting(input: string): string[] {
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
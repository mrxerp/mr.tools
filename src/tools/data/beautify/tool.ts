export interface BeautifyOptions {
  indent?: number | string;
  sortKeys?: boolean;
  minify?: boolean;
}

export interface BeautifyResult {
  output: string;
  valid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

export function beautifyJson(input: string, options: BeautifyOptions = {}): BeautifyResult {
  const { indent = 2, sortKeys = false, minify = false } = options;

  if (!input.trim()) {
    return { output: "", valid: true };
  }

  try {
    let parsed: unknown = JSON.parse(input);

    if (sortKeys && typeof parsed === "object" && parsed !== null) {
      parsed = sortObjectKeys(parsed);
    }

    const output = minify
      ? JSON.stringify(parsed)
      : JSON.stringify(parsed, null, indent);

    return { output, valid: true };
  } catch (e) {
    const error = e as SyntaxError;
    const { line, column } = extractErrorPosition(input, error.message);
    return {
      output: "",
      valid: false,
      error: {
        message: error.message,
        line,
        column,
      },
    };
  }
}

export function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function extractErrorPosition(input: string, message: string): { line?: number; column?: number } {
  // Try multiple patterns for different Node.js versions
  let match = message.match(/position (\d+)/);
  if (!match) match = message.match(/at position (\d+)/);
  if (!match) match = message.match(/at (\d+)/);
  if (!match) match = message.match(/\((\d+):(\d+)\)/); // line:column format
  if (!match) return { line: 1, column: 1 };
  let pos: number;
  let line: number;
  let column: number;
  if (match[1] !== undefined && match[2] !== undefined) {
    // Line and column format: (line:column)
    line = parseInt(match[1], 10);
    column = parseInt(match[2], 10);
  } else {
    // Position offset
    pos = parseInt(match[1], 10);
    const lines = input.slice(0, pos).split("\n");
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }
  return { line, column };
}

export function validateJson(input: string): BeautifyResult {
  return beautifyJson(input, { minify: false });
}

export function minifyJson(input: string): BeautifyResult {
  return beautifyJson(input, { minify: true });
}
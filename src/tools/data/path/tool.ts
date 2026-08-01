export interface PathNode {
  path: string;
  jsonPath: string;
  pointer: string;
  value: unknown;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  children?: PathNode[];
}

export interface PathResult {
  tree: PathNode[];
  selectedPath?: {
    jsonPath: string;
    pointer: string;
  };
}

export function buildPathTree(data: unknown, maxDepth = 10): PathNode[] {
  return visitNode(data, "$", "", 0, maxDepth);
}

function visitNode(
  value: unknown,
  jsonPath: string,
  pointer: string,
  depth: number,
  maxDepth: number,
): PathNode {
  const type = getType(value);
  const node: PathNode = {
    path: jsonPath,
    jsonPath,
    pointer,
    value: type === "object" || type === "array" ? undefined : value,
    type,
  };

  if (depth < maxDepth) {
    if (type === "object" && value !== null) {
      node.children = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        visitNode(v, `${jsonPath}.${escapeJsonPathKey(k)}`, `${pointer}/${escapePointerKey(k)}`, depth + 1, maxDepth),
      );
    } else if (type === "array") {
      node.children = (value as unknown[]).map((v, i) =>
        visitNode(v, `${jsonPath}[${i}]`, `${pointer}/${i}`, depth + 1, maxDepth),
      );
    }
  }

  return node;
}

function getType(value: unknown): PathNode["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as PathNode["type"];
}

function escapeJsonPathKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
  return `['${key.replace(/'/g, "\\'")}']`;
}

function escapePointerKey(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function getPathForNode(tree: PathNode[], targetJsonPath: string): PathNode | undefined {
  for (const node of tree) {
    const found = findNode(node, targetJsonPath);
    if (found) return found;
  }
  return undefined;
}

function findNode(node: PathNode, target: string): PathNode | undefined {
  if (node.jsonPath === target) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, target);
      if (found) return found;
    }
  }
  return undefined;
}

export function evaluateJsonPath(data: unknown, path: string): unknown {
  try {
    let current: unknown = data;
    const tokens = tokenizeJsonPath(path);

    for (const token of tokens) {
      if (current === null || current === undefined) return undefined;

      if (typeof token === "number") {
        if (!Array.isArray(current)) return undefined;
        current = current[token];
      } else {
        if (typeof current !== "object" || current === null) return undefined;
        current = (current as Record<string, unknown>)[token];
      }
    }
    return current;
  } catch {
    return undefined;
  }
}

export function tokenizeJsonPath(path: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  let current = path;

  if (current.startsWith("$")) current = current.slice(1);

  const regex = /\.?([a-zA-Z_$][a-zA-Z0-9_$]*)|\[(\d+)\]|\[['"]([^'"]+)['"]\]/g;
  let match;

  while ((match = regex.exec(current)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) tokens.push(parseInt(match[2], 10));
    else if (match[3]) tokens.push(match[3]);
  }

  return tokens;
}

export function evaluatePointer(data: unknown, pointer: string): unknown {
  if (pointer === "" || pointer === "#") return data;
  if (!pointer.startsWith("/")) return undefined;

  const parts = pointer.slice(1).split("/").map(decodePointerPart);
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (isNaN(index)) return undefined;
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function decodePointerPart(part: string): string {
  return part.replace(/~1/g, "/").replace(/~0/g, "~");
}
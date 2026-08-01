export interface GrokNode {
  path: string;
  key: string;
  value: unknown;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  size: number;
  children?: GrokNode[];
  collapsed?: boolean;
}

export interface GrokResult {
  tree: GrokNode[];
  totalSize: number;
  nodeCount: number;
}

export interface EvalResult {
  result: unknown;
  error?: string;
}

export function buildGrokTree(data: unknown, maxNodes = 10000): GrokResult {
  const nodes: GrokNode[] = [];
  let nodeCount = 0;

  function visit(value: unknown, path: string, key: string): GrokNode | null {
    if (nodeCount >= maxNodes) return null;
    nodeCount++;

    const type = getType(value);
    const size = calculateSize(value);
    const node: GrokNode = {
      path,
      key,
      value: type === "object" || type === "array" ? undefined : value,
      type,
      size,
      collapsed: type === "object" || type === "array",
    };

    if ((type === "object" || type === "array") && nodeCount < maxNodes) {
      node.children = [];
      if (type === "object" && value !== null) {
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          const child = visit(v, `${path}.${k}`, k);
          if (child) node.children!.push(child);
        }
      } else if (type === "array") {
        (value as unknown[]).forEach((v, i) => {
          const child = visit(v, `${path}[${i}]`, String(i));
          if (child) node.children!.push(child);
        });
      }
    }

    return node;
  }

  const root = visit(data, "$", "$");
  if (root) nodes.push(root);

  return { tree: nodes, totalSize: calculateSize(data), nodeCount };
}

function getType(value: unknown): GrokNode["type"] {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as GrokNode["type"];
}

export function calculateSize(value: unknown): number {
  return JSON.stringify(value).length;
}

export function evaluateExpression(data: unknown, expression: string): EvalResult {
  try {
    const result = evalExpression(data, expression);
    return { result };
  } catch (e) {
    return { result: null, error: (e as Error).message };
  }
}

export function evalExpression(data: unknown, expr: string): unknown {
  expr = expr.trim();
  if (!expr || expr === "$") return data;

  if (expr.startsWith("$.")) expr = expr.slice(2);
  else if (expr.startsWith("$[")) expr = expr.slice(1);

  const tokens = tokenize(expr);
  let current: unknown = data;

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
}

export function tokenize(expr: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  const regex = /\.?([a-zA-Z_$][a-zA-Z0-9_$]*)|\[(\d+)\]|\[['"]([^'"]+)['"]\]/g;
  let match;
  while ((match = regex.exec(expr)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) tokens.push(parseInt(match[2], 10));
    else if (match[3]) tokens.push(match[3]);
  }
  return tokens;
}

export function getPage(nodes: GrokNode[], page: number, pageSize: number): GrokNode[] {
  const flat = flattenTree(nodes);
  const start = page * pageSize;
  return flat.slice(start, start + pageSize);
}

export function flattenTree(nodes: GrokNode[], result: GrokNode[] = []): GrokNode[] {
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      flattenTree(node.children, result);
    }
  }
  return result;
}

export function searchTree(nodes: GrokNode[], query: string): GrokNode[] {
  const results: GrokNode[] = [];
  const lowerQuery = query.toLowerCase();

  function search(node: GrokNode) {
    const keyMatch = node.key.toLowerCase().includes(lowerQuery);
    const valueMatch =
      node.value !== undefined && String(node.value).toLowerCase().includes(lowerQuery);
    const pathMatch = node.path.toLowerCase().includes(lowerQuery);

    if (keyMatch || valueMatch || pathMatch) {
      results.push(node);
    }
    if (node.children) {
      for (const child of node.children) search(child);
    }
  }

  for (const node of nodes) search(node);
  return results;
}
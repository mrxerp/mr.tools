export type DiffOp = { type: "add" | "del" | "same"; text: string };

export interface DiffSummary {
  addedLines: number;
  removedLines: number;
  addedWords: number;
  removedWords: number;
}

const MAX_TOKENS = 2000;

export function diffLines(a: string, b: string): DiffOp[] {
  return lcsDiff(a.split("\n"), b.split("\n"));
}

export function diffChars(a: string, b: string): DiffOp[] {
  return lcsDiff(Array.from(a), Array.from(b));
}

export function diffSummary(a: string, b: string): DiffSummary {
  const ops = diffLines(a, b);
  const sum: DiffSummary = { addedLines: 0, removedLines: 0, addedWords: 0, removedWords: 0 };
  for (const op of ops) {
    const words = (op.text.trim().match(/\S+/g) ?? []).length;
    if (op.type === "add") {
      sum.addedLines++;
      sum.addedWords += words;
    } else if (op.type === "del") {
      sum.removedLines++;
      sum.removedWords += words;
    }
  }
  return sum;
}

export function lcsDiff(a: string[], b: string[]): DiffOp[] {
  // ponytail: O(n*m) DP; falls back to whole-segment ops past MAX_TOKENS
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    const ops: DiffOp[] = [];
    if (a.length) ops.push({ type: "del", text: a.join("\n") });
    if (b.length) ops.push({ type: "add", text: b.join("\n") });
    return ops;
  }
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", text: a[i] });
      i++;
    } else {
      ops.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i++] });
  while (j < m) ops.push({ type: "add", text: b[j++] });
  return ops;
}

type TokenType = "number" | "ident" | "op" | "lparen" | "rparen" | "comma" | "end";

interface Token {
  type: TokenType;
  value: string | number;
  pos: number;
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const FUNCTIONS: Record<string, { arity: number; fn: (args: number[]) => number }> = {
  sqrt: {
    arity: 1,
    fn: (a) => {
      if (a[0] < 0) throw new Error("sqrt of a negative number");
      return Math.sqrt(a[0]);
    },
  },
  abs: { arity: 1, fn: (a) => Math.abs(a[0]) },
  floor: { arity: 1, fn: (a) => Math.floor(a[0]) },
  ceil: { arity: 1, fn: (a) => Math.ceil(a[0]) },
  round: { arity: 1, fn: (a) => Math.round(a[0]) },
  min: { arity: 2, fn: (a) => Math.min(a[0], a[1]) },
  max: { arity: 2, fn: (a) => Math.max(a[0], a[1]) },
  log: {
    arity: 1,
    fn: (a) => {
      if (a[0] <= 0) throw new Error("log requires a positive argument");
      return Math.log(a[0]);
    },
  },
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+/.exec(src.slice(i));
      if (!m) throw new Error(`Invalid number at position ${i}`);
      tokens.push({ type: "number", value: parseFloat(m[0]), pos: i });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i))!;
      tokens.push({ type: "ident", value: m[0], pos: i });
      i += m[0].length;
      continue;
    }
    if ("+-*/^%".includes(c)) {
      tokens.push({ type: "op", value: c, pos: i });
      i += 1;
      continue;
    }
    if (c === "(") {
      tokens.push({ type: "lparen", value: c, pos: i });
      i += 1;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "rparen", value: c, pos: i });
      i += 1;
      continue;
    }
    if (c === ",") {
      tokens.push({ type: "comma", value: c, pos: i });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character "${c}" at position ${i}`);
  }
  tokens.push({ type: "end", value: "", pos: src.length });
  return tokens;
}

export function evaluate(expr: string): number {
  if (typeof expr !== "string") {
    throw new Error("expression must be a string");
  }
  const trimmed = expr.trim();
  if (trimmed === "") {
    throw new Error("expression is empty");
  }
  const tokens = tokenize(trimmed);
  let pos = 0;
  const peek = (): Token => tokens[pos];
  const next = (): Token => tokens[pos++];

  function expectType(type: TokenType): Token {
    const t = next();
    if (t.type !== type) {
      throw new Error(`Expected "${type}" at position ${t.pos}`);
    }
    return t;
  }

  function parseAdditive(): number {
    let value = parseMultiplicative();
    while (peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
      const op = next().value as string;
      const rhs = parseMultiplicative();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseMultiplicative(): number {
    let value = parseUnary();
    while (
      peek().type === "op" &&
      (peek().value === "*" || peek().value === "/" || peek().value === "%")
    ) {
      const op = next().value as string;
      const rhs = parseUnary();
      if (op === "*") {
        value *= rhs;
      } else if (op === "/") {
        if (rhs === 0) throw new Error("Division by zero");
        value /= rhs;
      } else {
        if (rhs === 0) throw new Error("Modulo by zero");
        value %= rhs;
      }
    }
    return value;
  }

  function parseUnary(): number {
    const t = peek();
    if (t.type === "op" && (t.value === "-" || t.value === "+")) {
      next();
      const v = parseUnary();
      return t.value === "-" ? -v : v;
    }
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePrimary();
    if (peek().type === "op" && peek().value === "^") {
      next();
      const exp = parseUnary();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parsePrimary(): number {
    const t = next();
    if (t.type === "number") {
      return t.value as number;
    }
    if (t.type === "ident") {
      const name = t.value as string;
      if (name in CONSTANTS) {
        return CONSTANTS[name];
      }
      const fn = FUNCTIONS[name];
      if (!fn) {
        throw new Error(`Unknown identifier "${name}"`);
      }
      expectType("lparen");
      const args: number[] = [];
      if (peek().type !== "rparen") {
        args.push(parseAdditive());
        while (peek().type === "comma") {
          next();
          args.push(parseAdditive());
        }
      }
      expectType("rparen");
      if (args.length !== fn.arity) {
        throw new Error(`${name} expects ${fn.arity} argument${fn.arity === 1 ? "" : "s"}`);
      }
      return fn.fn(args);
    }
    if (t.type === "lparen") {
      const v = parseAdditive();
      expectType("rparen");
      return v;
    }
    throw new Error(`Unexpected token "${t.value}" at position ${t.pos}`);
  }

  const result = parseAdditive();
  if (peek().type !== "end") {
    throw new Error(`Unexpected "${peek().value}" at position ${peek().pos}`);
  }
  if (!Number.isFinite(result)) {
    throw new Error("Result is not a finite number");
  }
  return result;
}

export interface MatchInfo {
  index: number;
  text: string;
  groups: (string | undefined)[];
}

export interface RegexResult {
  ok: boolean;
  error: string;
  matches: MatchInfo[];
  count: number;
  groupNames: string[];
}

export interface ReplaceResult {
  ok: boolean;
  error: string;
  result: string;
  count: number;
}

const MAX_MATCHES = 1000;

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
  let global: RegExp;
  try {
    global = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      matches: [],
      count: 0,
      groupNames: [],
    };
  }
  const groupNames = [...new Set(pattern.matchAll(/\(\?<([A-Za-z][A-Za-z0-9]*)>/g))].map((m) => m[1]);
  const matches: MatchInfo[] = [];
  let m: RegExpExecArray | null;
  while (matches.length < MAX_MATCHES && (m = global.exec(text)) !== null) {
    matches.push({ index: m.index, text: m[0], groups: m.slice(1) });
    if (m[0] === "") global.lastIndex++;
  }
  return { ok: true, error: "", matches, count: matches.length, groupNames };
}

export function replacePreview(
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
): ReplaceResult {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      result: "",
      count: 0,
    };
  }
  let count = 0;
  text.replace(re, () => {
    count++;
    return "";
  });
  const result = text.replace(re, replacement);
  return { ok: true, error: "", result, count };
}

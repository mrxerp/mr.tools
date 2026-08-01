export type RandomSource = () => number;
export type SaladMode = "scramble" | "reverse" | "sort";

export function shuffle<T>(arr: T[], rand: RandomSource = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function scrambleWord(word: string, rand: RandomSource = Math.random): string {
  const chars = [...word];
  if (chars.length <= 3) return word;
  const first = chars[0];
  const last = chars[chars.length - 1];
  const mid = shuffle(chars.slice(1, -1), rand);
  return first + mid.join("") + last;
}

export function scramble(text: string, rand: RandomSource = Math.random): string {
  return text
    .split(/(\b)/)
    .map((t) => (/[a-zA-Z]+/.test(t) ? scrambleWord(t, rand) : t))
    .join("");
}

export function reverseWords(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      sentencesOf(line)
        .map((s) => {
          const end = s.match(/[.!?]+$/)?.[0] ?? "";
          const body = end ? s.slice(0, -end.length) : s;
          const words = body.match(/\S+/g);
          return words ? words.reverse().join(" ") + end : s;
        })
        .join(" "),
    )
    .join("\n");
}

export function sortLetters(text: string): string {
  return text
    .split(/(\b)/)
    .map((t) => (/[a-zA-Z]+/.test(t) ? [...t].sort().join("") : t))
    .join("");
}

export function salad(text: string, mode: SaladMode, rand: RandomSource = Math.random): string {
  switch (mode) {
    case "scramble":
      return scramble(text, rand);
    case "reverse":
      return reverseWords(text);
    case "sort":
      return sortLetters(text);
  }
}

function sentencesOf(line: string): string[] {
  const out: string[] = [];
  const re = /[^.!?]+[.!?]*/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(line)) !== null) {
    out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

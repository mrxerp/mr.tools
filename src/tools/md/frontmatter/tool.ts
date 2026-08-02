export interface FrontMatter {
  title?: string;
  date?: string;
  slug?: string;
  tags?: string[];
  draft?: boolean;
  [key: string]: unknown;
}

export interface FixResult {
  original: string;
  fixed: string;
  warnings: string[];
  suggestedFilename?: string;
}

function parseFrontMatter(content: string): { frontMatter: FrontMatter | null; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { frontMatter: null, body: content };
  try {
    const fm = parseYAML(fmMatch[1]);
    return { frontMatter: fm, body: fmMatch[2] };
  } catch {
    return { frontMatter: null, body: content };
  }
}

function parseYAML(yaml: string): FrontMatter {
  const result: FrontMatter = {};
  const lines = yaml.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value: string | string[] | boolean = match[2].trim();
      if (typeof value === "string") {
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (value === "true") value = true;
        else if (value === "false") value = false;
        else if (value.startsWith("[") && value.endsWith("]")) {
          value = value.slice(1, -1).split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
        }
      }
      result[key] = value;
    }
  }
  return result;
}

function stringifyYAML(fm: FrontMatter): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => (typeof v === "string" ? `"${v}"` : v)).join(", ")}]`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "string" && value.includes(" ")) {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join("\n");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function fixDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

export function fixFrontMatter(content: string): FixResult {
  const warnings: string[] = [];
  const { frontMatter, body } = parseFrontMatter(content);

  if (!frontMatter) {
    return { original: content, fixed: content, warnings: ["No front matter found"], suggestedFilename: undefined };
  }

  const fixed: FrontMatter = { ...frontMatter };

  if (fixed.title && !fixed.slug) {
    fixed.slug = slugify(fixed.title);
    warnings.push(`Generated slug from title: ${fixed.slug}`);
  }

  if (fixed.date && typeof fixed.date === "string") {
    const fixedDate = fixDate(fixed.date);
    if (fixedDate !== fixed.date) {
      warnings.push(`Fixed date format: ${fixed.date} → ${fixedDate}`);
      fixed.date = fixedDate;
    }
  }

  if (fixed.tags && Array.isArray(fixed.tags)) {
    fixed.tags = fixed.tags.map((t) => slugify(t)).filter(Boolean);
    warnings.push(`Normalized tags: ${fixed.tags.join(", ")}`);
  }

  const fixedContent = `---\n${stringifyYAML(fixed)}\n---\n${body}`;
  const suggestedFilename = fixed.slug ? `${fixed.slug}.md` : undefined;

  return { original: content, fixed: fixedContent, warnings, suggestedFilename };
}

export function batchFix(files: Array<{ name: string; content: string }>): Array<{ name: string; result: FixResult }> {
  return files.map(({ name, content }) => ({ name, result: fixFrontMatter(content) }));
}
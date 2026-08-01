export interface DocTemplate {
  name: string;
  fontFamily: string;
  fontSize: number;
  headingStyles: Record<number, { size: number; bold: boolean; color: string }>;
  margins: { top: number; right: number; bottom: number; left: number };
}

export const TEMPLATES: DocTemplate[] = [
  {
    name: "Professional",
    fontFamily: "Calibri",
    fontSize: 11,
    headingStyles: {
      1: { size: 28, bold: true, color: "1F4E79" },
      2: { size: 22, bold: true, color: "2E75B6" },
      3: { size: 16, bold: true, color: "548DD4" },
    },
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  },
  {
    name: "Academic",
    fontFamily: "Times New Roman",
    fontSize: 12,
    headingStyles: {
      1: { size: 24, bold: true, color: "000000" },
      2: { size: 18, bold: true, color: "000000" },
      3: { size: 14, bold: true, color: "000000" },
    },
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
  },
  {
    name: "Modern",
    fontFamily: "Arial",
    fontSize: 11,
    headingStyles: {
      1: { size: 26, bold: true, color: "2C3E50" },
      2: { size: 20, bold: true, color: "34495E" },
      3: { size: 16, bold: true, color: "7F8C8D" },
    },
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  },
];

export function parseMarkdown(markdown: string): Array<{ type: string; content: string; level?: number }> {
  const lines = markdown.split("\n");
  const blocks: Array<{ type: string; content: string; level?: number }> = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeContent = "";
      } else {
        inCodeBlock = false;
        blocks.push({ type: "code", content: codeContent, level: 0 });
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: "heading", content: headingMatch[2], level: headingMatch[1].length });
      continue;
    }

    if (line.match(/^[-*+]\s+/)) {
      blocks.push({ type: "list", content: line.replace(/^[-*+]\s+/, ""), level: 0 });
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      blocks.push({ type: "olist", content: line.replace(/^\d+\.\s+/, ""), level: 0 });
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push({ type: "blockquote", content: line.slice(2), level: 0 });
      continue;
    }

    if (line.trim() === "") {
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== "paragraph") {
        blocks.push({ type: "paragraph", content: "", level: 0 });
      }
      continue;
    }

    if (line.startsWith("---") || line.startsWith("***")) {
      blocks.push({ type: "hr", content: "", level: 0 });
      continue;
    }

    if (blocks.length > 0 && blocks[blocks.length - 1].type === "paragraph") {
      blocks[blocks.length - 1].content += (blocks[blocks.length - 1].content ? " " : "") + line;
    } else {
      blocks.push({ type: "paragraph", content: line, level: 0 });
    }
  }

  return blocks;
}

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "[$1]");
}

export function blocksToPlainText(blocks: Array<{ type: string; content: string; level?: number }>): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return "#".repeat(b.level || 1) + " " + processInline(b.content);
        case "code":
          return "```\n" + b.content + "```";
        case "list":
          return "- " + processInline(b.content);
        case "olist":
          return "1. " + processInline(b.content);
        case "blockquote":
          return "> " + processInline(b.content);
        case "hr":
          return "---";
        default:
          return processInline(b.content);
      }
    })
    .join("\n\n");
}
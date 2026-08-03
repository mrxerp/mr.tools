export interface MetaInput {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  themeColor?: string;
  robots?: string;
  canonical?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attr(name: string, value: string): string {
  return `${name}="${escapeHtml(value)}"`;
}

export function buildMetaTags(input: MetaInput): string {
  const lines: string[] = [];

  if (input.title) {
    lines.push(`<title>${escapeHtml(input.title)}</title>`);
  }
  if (input.description) {
    lines.push(`<meta name="description" ${attr("content", input.description)}>`);
  }
  if (input.themeColor) {
    lines.push(`<meta name="theme-color" ${attr("content", input.themeColor)}>`);
  }
  if (input.robots) {
    lines.push(`<meta name="robots" ${attr("content", input.robots)}>`);
  }
  if (input.url) {
    lines.push(`<link rel="canonical" ${attr("href", input.canonical || input.url)}>`);
  }
  if (input.title) {
    lines.push(`<meta property="og:title" ${attr("content", input.title)}>`);
  }
  if (input.description) {
    lines.push(`<meta property="og:description" ${attr("content", input.description)}>`);
  }
  if (input.url) {
    lines.push(`<meta property="og:url" ${attr("content", input.url)}>`);
  }
  if (input.image) {
    lines.push(`<meta property="og:image" ${attr("content", input.image)}>`);
  }
  if (input.type) {
    lines.push(`<meta property="og:type" ${attr("content", input.type)}>`);
  }
  if (input.siteName) {
    lines.push(`<meta property="og:site_name" ${attr("content", input.siteName)}>`);
  }
  if (input.twitterCard) {
    lines.push(`<meta name="twitter:card" ${attr("content", input.twitterCard)}>`);
  }
  if (input.title) {
    lines.push(`<meta name="twitter:title" ${attr("content", input.title)}>`);
  }
  if (input.description) {
    lines.push(`<meta name="twitter:description" ${attr("content", input.description)}>`);
  }
  if (input.image) {
    lines.push(`<meta name="twitter:image" ${attr("content", input.image)}>`);
  }

  return lines.join("\n");
}

export function titleLength(title: string | undefined): number {
  return title ? title.length : 0;
}

export function descriptionLength(description: string | undefined): number {
  return description ? description.length : 0;
}

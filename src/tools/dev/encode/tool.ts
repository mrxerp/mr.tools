// EncodeDeck: Encoding/decoding utilities for developers
// Supports Base64, URL, URI component, HTML entities, Unicode escapes, and JWT payload decode

export interface EncodeResult {
  type: string;
  value: string;
}

export function decodeBase64(input: string): string {
  return atob(input);
}

export function encodeBase64(input: string): string {
  return btoa(input);
}

export function decodeUrl(input: string): string {
  return decodeURIComponent(input);
}

export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUriComponent(input: string): string {
  return decodeURIComponent(input);
}

export function encodeUriComponent(input: string): string {
  return encodeURIComponent(input);
}

export function decodeHtmlEntities(input: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
}

export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"']/g, (match) => {
    const map: Record<string, string> = {
      "&": "&",
      "<": "<",
      ">": ">",
      '"': "\"",
      "'": "'",
    };
    return map[match];
  });
}

export function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

export function encodeUnicodeEscapes(input: string): string {
  return [...input]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 128) return char;
      return `\\u${code.toString(16).padStart(4, "0")}`;
    })
    .join("");
}

export function decodeJwtPayload(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT token format");
    const payload = parts[1];
    // Add padding if needed
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.stringify(JSON.parse(decoded), null, 2);
  } catch (err) {
    throw new Error(`Invalid JWT token: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export function encodeAll(text: string): EncodeResult[] {
  if (!text) return [];

  return [
    { type: "Base64", value: encodeBase64(text) },
    { type: "URL", value: encodeUrl(text) },
    { type: "URI Component", value: encodeUriComponent(text) },
    { type: "HTML Entities", value: encodeHtmlEntities(text) },
    { type: "Unicode Escapes", value: encodeUnicodeEscapes(text) },
  ];
}

export function decodeAll(input: string): EncodeResult[] {
  if (!input) return [];

  const results: EncodeResult[] = [];

  try {
    results.push({ type: "Base64", value: decodeBase64(input) });
  } catch {
    results.push({ type: "Base64", value: "[Invalid Base64]" });
  }

  try {
    results.push({ type: "URL", value: decodeUrl(input) });
  } catch {
    results.push({ type: "URL", value: "[Invalid URL encoding]" });
  }

  try {
    results.push({ type: "URI Component", value: decodeUriComponent(input) });
  } catch {
    results.push({ type: "URI Component", value: "[Invalid URI component encoding]" });
  }

  try {
    results.push({ type: "HTML Entities", value: decodeHtmlEntities(input) });
  } catch {
    results.push({ type: "HTML Entities", value: "[Invalid HTML entities]" });
  }

  try {
    results.push({ type: "Unicode Escapes", value: decodeUnicodeEscapes(input) });
  } catch {
    results.push({ type: "Unicode Escapes", value: "[Invalid Unicode escapes]" });
  }

  try {
    results.push({ type: "JWT Payload", value: decodeJwtPayload(input) });
  } catch {
    results.push({ type: "JWT Payload", value: "[Invalid JWT token]" });
  }

  return results;
}
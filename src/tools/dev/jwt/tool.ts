const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();

function b64urlDecode(part: string): Uint8Array {
  let input = part.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4 !== 0) input += "=";
  const bin = atob(input);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseJsonPart(part: string): Record<string, unknown> {
  const text = new TextDecoder().decode(b64urlDecode(part));
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("JWT part is not a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function decodeJwt(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  parts: string[];
} {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("A JWT must have exactly three dot-separated parts");
  }
  if (parts.some((p) => p.length === 0)) {
    throw new Error("JWT contains an empty part");
  }
  const header = parseJsonPart(parts[0]);
  const payload = parseJsonPart(parts[1]);
  return { header, payload, signature: parts[2], parts };
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyHs256(
  token: string,
  secret: string,
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  if (!secret) return false;
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await subtle.sign(
    "HMAC",
    key,
    encoder.encode(parts[0] + "." + parts[1]),
  );
  const sig = b64urlDecode(parts[2]);
  return constantTimeEqual(new Uint8Array(expected), sig);
}

export interface ExpiryInfo {
  expired: boolean;
  exp?: string;
  iat?: string;
  nbf?: string;
}

export function expiryInfo(payload: Record<string, unknown>): ExpiryInfo {
  const info: ExpiryInfo = { expired: false };
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number") {
    info.exp = new Date(payload.exp * 1000).toISOString();
    info.expired = payload.exp < nowSec;
  }
  if (typeof payload.iat === "number") {
    info.iat = new Date(payload.iat * 1000).toISOString();
  }
  if (typeof payload.nbf === "number") {
    info.nbf = new Date(payload.nbf * 1000).toISOString();
  }
  return info;
}

import { strictEqual, ok, throws } from "node:assert";
import { decodeJwt, verifyHs256, expiryInfo } from "./tool.ts";

const encoder = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signToken(headerPayload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(headerPayload),
  );
  return b64urlEncode(new Uint8Array(sig));
}

async function makeToken(payload: unknown, secret: string): Promise<string> {
  const header = b64urlEncode(
    encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const body = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const sig = await signToken(`${header}.${body}`, secret);
  return `${header}.${body}.${sig}`;
}

export async function runTest() {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const token = await makeToken({ sub: "123", exp: future }, "s3cret");

  const decoded = decodeJwt(token);
  strictEqual(decoded.header.alg, "HS256", "header alg");
  strictEqual(decoded.header.typ, "JWT", "header typ");
  strictEqual(decoded.payload.sub, "123", "payload sub");
  strictEqual(decoded.parts.length, 3, "three parts");
  strictEqual(decoded.signature, token.split(".")[2], "signature extracted");

  ok(await verifyHs256(token, "s3cret"), "valid signature verifies");
  ok(!(await verifyHs256(token, "wrong")), "wrong secret rejected");

  const parts = token.split(".");
  const evilBody = b64urlEncode(
    encoder.encode(JSON.stringify({ sub: "999", exp: future })),
  );
  const tampered = `${parts[0]}.${evilBody}.${parts[2]}`;
  ok(!(await verifyHs256(tampered, "s3cret")), "tampered payload rejected");

  throws(() => decodeJwt("a.b"), /three/, "two parts throws");
  throws(() => decodeJwt("a.b.c.d"), /three/, "four parts throws");
  throws(() => decodeJwt("!!!.e30.e30"), (e) => e instanceof Error, "bad base64 throws");
  throws(() => decodeJwt("aGVsbG8.e30.e30"), (e) => e instanceof Error, "non-JSON part throws");

  const past = Math.floor(Date.now() / 1000) - 60;
  const expiredInfo = expiryInfo({ exp: past, iat: past, nbf: past });
  strictEqual(expiredInfo.expired, true, "past exp is expired");
  ok(typeof expiredInfo.exp === "string", "exp formatted as ISO");
  ok(typeof expiredInfo.iat === "string", "iat formatted as ISO");
  ok(typeof expiredInfo.nbf === "string", "nbf formatted as ISO");
  const liveInfo = expiryInfo({ exp: future });
  strictEqual(liveInfo.expired, false, "future exp is not expired");
}

const HEX = "0123456789abcdef";

export function generateUuid(version: 4 | 7, uppercase = false): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  if (version === 7) {
    let now = BigInt(Date.now());
    for (let i = 5; i >= 0; i--) {
      bytes[i] = Number(now & 0xffn);
      now >>= 8n;
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | (version << 4);
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let out = "";
  for (let i = 0; i < 16; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
    if (i === 3 || i === 5 || i === 7 || i === 9) out += "-";
  }
  return uppercase ? out.toUpperCase() : out;
}

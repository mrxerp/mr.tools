import { strictEqual } from "node:assert";
import { buildVCard, generateVCardQrDataUrl } from "./tool.ts";

export async function runTest() {
  strictEqual(
    buildVCard({ firstName: "Forrest", lastName: "Gump", fullName: "Forrest Gump", phone: "+15551234567", email: "forrest@example.com" }),
    "BEGIN:VCARD\r\nVERSION:3.0\r\nN:Gump;Forrest;;;\r\nFN:Forrest Gump\r\nTEL;TYPE=CELL:+15551234567\r\nEMAIL:forrest@example.com\r\nEND:VCARD",
  );

  strictEqual(
    buildVCard({ fullName: "Ada" }),
    "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Ada\r\nEND:VCARD",
  );

  strictEqual(
    buildVCard({ firstName: "Ada", lastName: "Lovelace" }),
    "BEGIN:VCARD\r\nVERSION:3.0\r\nN:Lovelace;Ada;;;\r\nFN:Ada Lovelace\r\nEND:VCARD",
  );

  strictEqual(
    buildVCard({ org: "Acme; Inc", title: "CEO", street: "1 Main St", city: "Springfield", region: "IL", postalCode: "62701", country: "US" }),
    "BEGIN:VCARD\r\nVERSION:3.0\r\nORG:Acme\\; Inc\r\nTITLE:CEO\r\nADR;TYPE=HOME:;;1 Main St;Springfield;IL;62701;US\r\nEND:VCARD",
  );

  strictEqual(
    buildVCard({ street: "A,B", country: "US" }),
    "BEGIN:VCARD\r\nVERSION:3.0\r\nADR;TYPE=HOME:;;A\\,B;;;;US\r\nEND:VCARD",
  );

  strictEqual(buildVCard({}), "");
  strictEqual(buildVCard({ firstName: "  ", lastName: "  " }), "");

  const src = await generateVCardQrDataUrl({ fullName: "Ada Lovelace" });
  strictEqual(src.startsWith("data:image/png;base64,"), true);
}

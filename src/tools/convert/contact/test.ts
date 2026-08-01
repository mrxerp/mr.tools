import { strictEqual, ok } from "node:assert";
import { parseContacts, deduplicateContacts, generateVCard, generateVCardFile, formatBytes } from "./tool.ts";

export async function runTest() {
  const csvText = `first,last,email,phone,organization,title
John,Doe,john@example.com,+15551234567,Acme Corp,Engineer
Jane,Smith,jane@test.com,+15559876543,Globex,Manager
John,Doe,john.doe@work.com,+15551112222,Acme Corp,Senior Engineer`;

  const contacts = parseContacts(csvText);
  strictEqual(contacts.length, 3);
  strictEqual(contacts[0].firstName, "John");
  strictEqual(contacts[0].emails.length, 1);
  strictEqual(contacts[0].phones.length, 1);

  // Test deduplication with same UID
  const contactsWithSameUid = [
    { ...contacts[0], uid: "same" },
    { ...contacts[2], uid: "same" },
  ];
  const deduped = deduplicateContacts(contactsWithSameUid);
  strictEqual(deduped.length, 1);
  ok(deduped[0].emails.length === 2);

  const vcard = generateVCard(contacts[0], "3.0");
  ok(vcard.includes("BEGIN:VCARD"));
  ok(vcard.includes("FN:John Doe"));
  ok(vcard.includes("EMAIL:john@example.com"));
  ok(vcard.includes("TEL:+15551234567"));
  ok(vcard.includes("END:VCARD"));

  const merged = generateVCardFile(contacts, { version: "3.0", merge: true });
  ok(merged.includes("BEGIN:VCARD"));
  ok(merged.includes("John Doe"));
  ok(merged.includes("Jane Smith"));

  const separate = generateVCardFile(contacts, { version: "3.0", merge: false });
  ok(separate.includes("BEGIN:VCARD"));
  const vcardCount = (separate.match(/BEGIN:VCARD/g) || []).length;
  strictEqual(vcardCount, 3);

  strictEqual(formatBytes(500), "500 B");
  strictEqual(formatBytes(2048), "2.0 KB");

  console.log("All contact tests passed");
}
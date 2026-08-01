export interface Contact {
  uid: string;
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  emails: string[];
  phones: string[];
  address?: string;
  birthday?: string;
  note?: string;
}

export interface VCardOptions {
  version: "2.1" | "3.0" | "4.0";
  merge: boolean;
}

export function parseContacts(text: string, format: "csv" | "xlsx" = "csv"): Contact[] {
  if (format === "csv") return parseCsv(text);
  return [];
}

function parseCsv(text: string): Contact[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const colMap: Record<string, number> = {};

  const fieldNames = [
    "firstName", "lastname", "first", "last", "given", "surname",
    "organization", "org", "company",
    "title", "position", "role",
    "email", "email1", "email2", "emails",
    "phone", "phone1", "phone2", "mobile", "work", "home",
    "address", "street", "city", "state", "zip", "country",
    "birthday", "bday", "dob",
    "note", "notes", "comment",
    "uid", "id",
  ];

  for (const field of fieldNames) {
    colMap[field] = headers.findIndex(h => h === field || h.replace(/\d/, "") === field);
  }

  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.every(c => !c)) continue;

    const getCol = (key: string) => cols[colMap[key]] || "";

    const firstName = getCol("firstName") || getCol("first") || getCol("given") || "";
    const lastName = getCol("lastName") || getCol("last") || getCol("surname") || "";

    if (!firstName && !lastName) continue;

    const emails = [getCol("email"), getCol("email1"), getCol("email2")]
      .filter(e => e && isValidEmail(e));

    const phones = [getCol("phone"), getCol("phone1"), getCol("phone2"), getCol("mobile"), getCol("work"), getCol("home")]
      .filter(p => p && isValidPhone(p));

    const addressParts = [getCol("street"), getCol("city"), getCol("state"), getCol("zip"), getCol("country")]
      .filter(p => p);

    const contact: Contact = {
      uid: getCol("uid") || `${firstName}-${lastName}-${i}`.toLowerCase().replace(/\s+/g, "-"),
      firstName,
      lastName,
      organization: getCol("organization") || getCol("org") || getCol("company") || undefined,
      title: getCol("title") || getCol("position") || getCol("role") || undefined,
      emails,
      phones,
      address: addressParts.join(", ") || undefined,
      birthday: getCol("birthday") || getCol("bday") || getCol("dob") || undefined,
      note: getCol("note") || getCol("notes") || getCol("comment") || undefined,
    };

    contacts.push(contact);
  }

  return contacts;
}

export function deduplicateContacts(contacts: Contact[]): Contact[] {
  const seen = new Map<string, Contact>();

  for (const contact of contacts) {
    const key = contact.uid || `${contact.firstName}-${contact.lastName}-${contact.emails[0] || contact.phones[0] || ""}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      const merged = mergeContact(existing, contact);
      seen.set(key, merged);
    } else {
      seen.set(key, contact);
    }
  }

  return Array.from(seen.values());
}

function mergeContact(a: Contact, b: Contact): Contact {
  const emails = new Set([...a.emails, ...b.emails]);
  const phones = new Set([...a.phones, ...b.phones]);
  return {
    ...a,
    emails: Array.from(emails),
    phones: Array.from(phones),
    organization: a.organization || b.organization,
    title: a.title || b.title,
    address: a.address || b.address,
    birthday: a.birthday || b.birthday,
    note: a.note || b.note,
  };
}

export function generateVCard(contact: Contact, version: "2.1" | "3.0" | "4.0" = "3.0"): string {
  const v = version === "4.0" ? "4.0" : "3.0";
  let vcard = `BEGIN:VCARD\r\nVERSION:${v}\r\n`;

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  vcard += `FN:${escapeVCard(fullName)}\r\n`;
  vcard += `N:${escapeVCard(contact.lastName)};${escapeVCard(contact.firstName)};;;\r\n`;

  if (contact.organization) vcard += `ORG:${escapeVCard(contact.organization)}\r\n`;
  if (contact.title) vcard += `TITLE:${escapeVCard(contact.title)}\r\n`;

  for (const email of contact.emails) {
    vcard += `EMAIL:${escapeVCard(email)}\r\n`;
  }

  for (const phone of contact.phones) {
    vcard += `TEL:${escapeVCard(phone)}\r\n`;
  }

  if (contact.address) {
    vcard += `ADR:${escapeVCard(contact.address)}\r\n`;
  }

  if (contact.birthday) {
    vcard += `BDAY:${escapeVCard(contact.birthday)}\r\n`;
  }

  if (contact.note) {
    vcard += `NOTE:${escapeVCard(contact.note)}\r\n`;
  }

  vcard += `UID:${contact.uid}\r\n`;
  vcard += "END:VCARD\r\n";
  return vcard;
}

export function generateVCardFile(contacts: Contact[], options: VCardOptions): string {
  if (options.merge) {
    let vcard = `BEGIN:VCARD\r\nVERSION:${options.version}\r\n`;
    vcard += "FN:Contacts\r\n";
    vcard += "N:Contacts;;;;\r\n";

    for (const contact of contacts) {
      const fullName = `${contact.firstName} ${contact.lastName}`.trim();
      vcard += `NOTE:${escapeVCard(fullName)}: ${escapeVCard(contact.note || "")}\r\n`;
      for (const email of contact.emails) vcard += `EMAIL:${escapeVCard(email)}\r\n`;
      for (const phone of contact.phones) vcard += `TEL:${escapeVCard(phone)}\r\n`;
      if (contact.organization) vcard += `ORG:${escapeVCard(contact.organization)}\r\n`;
    }

    vcard += "END:VCARD\r\n";
    return vcard;
  }

  return contacts.map(c => generateVCard(c, options.version)).join("\n");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return /^\+?\d{7,15}$/.test(cleaned);
}

function escapeVCard(text: string): string {
  return text.replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n").replace(/\r/g, "");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
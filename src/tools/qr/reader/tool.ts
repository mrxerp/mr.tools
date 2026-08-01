export function classifyScan(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "Empty";
  if (/^wifi:/i.test(s)) return "Wi-Fi";
  if (/^BEGIN:VCARD/i.test(s)) return "Contact (vCard)";
  if (/^geo:/.test(s)) return "Map location";
  if (/^mailto:/i.test(s)) return "Email";
  if (/^tel:/i.test(s)) return "Phone";
  if (/^https?:\/\//i.test(s)) return "URL";
  if (/^\d{8,14}$/.test(s)) return "Numeric code";
  return "Text";
}

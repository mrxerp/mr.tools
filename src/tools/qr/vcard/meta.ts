import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "vcard",
  name: "mr.vcard",
  tagline: "Encode your contact details into a scannable vCard QR.",
  description: "mr.vcard - Build a vCard 3.0 contact card from form fields and render it as a QR that scans straight into your phone's contacts. Everything runs in your browser.",
  tags: ["qr", "vcard", "contact", "card"],
  icon: "form",
  difficulty: "Easy",
  offline: true,
  related: ["qr", "wifi-qr", "place"],
};

import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "chmod",
  name: "mr.chmod",
  tagline: "Convert between octal and symbolic file permissions.",
  description: "mr.chmod - Convert file permission modes between octal (like 755) and symbolic (like rwxr-xr-x) form, including the special bits: setuid, setgid, and sticky. Understands 3- and 4-digit octal and the s/S/t/T symbolic forms. All conversion happens locally in your browser.",
  tags: ["chmod", "permissions", "octal", "symbolic", "unix", "mode", "file"],
  icon: "lock",
  difficulty: "Easy",
  offline: true,
  related: ["encode", "hash", "regex"],
};

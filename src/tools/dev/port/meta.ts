import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "port",
  name: "mr.port",
  tagline: "Pick random TCP/UDP ports from safe ranges.",
  description: "mr.port - Pick random TCP/UDP ports from the IANA ranges: well-known (0-1023), registered (1024-49151), and dynamic/private (49152-65535). Optionally exclude common conflict ports. Generation uses cryptographically secure randomness and runs entirely offline.",
  tags: ["port", "tcp", "udp", "network", "random", "iana"],
  icon: "link",
  difficulty: "Easy",
  offline: true,
  related: ["token", "hash", "json"],
};

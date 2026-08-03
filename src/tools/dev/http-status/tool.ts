export type StatusCategory = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

export interface StatusCode {
  code: number;
  name: string;
  meaning: string;
  category: StatusCategory;
}

export const STATUS_CODES: StatusCode[] = [
  { code: 100, name: "Continue", meaning: "Continue sending the request body", category: "1xx" },
  { code: 101, name: "Switching Protocols", meaning: "Upgrade to a different protocol", category: "1xx" },
  { code: 102, name: "Processing", meaning: "Request accepted and being processed", category: "1xx" },
  { code: 200, name: "OK", meaning: "Request succeeded", category: "2xx" },
  { code: 201, name: "Created", meaning: "Resource created successfully", category: "2xx" },
  { code: 202, name: "Accepted", meaning: "Request accepted for processing", category: "2xx" },
  { code: 203, name: "Non-Authoritative Information", meaning: "Proxy-modified response returned", category: "2xx" },
  { code: 204, name: "No Content", meaning: "Success with no body", category: "2xx" },
  { code: 205, name: "Reset Content", meaning: "Reset the document view", category: "2xx" },
  { code: 206, name: "Partial Content", meaning: "Range request served partially", category: "2xx" },
  { code: 300, name: "Multiple Choices", meaning: "Multiple representations to choose from", category: "3xx" },
  { code: 301, name: "Moved Permanently", meaning: "Resource moved permanently", category: "3xx" },
  { code: 302, name: "Found", meaning: "Temporary redirect to another URI", category: "3xx" },
  { code: 303, name: "See Other", meaning: "Retrieve result at another URI", category: "3xx" },
  { code: 304, name: "Not Modified", meaning: "Cached copy is still valid", category: "3xx" },
  { code: 305, name: "Use Proxy", meaning: "Access resource only via proxy", category: "3xx" },
  { code: 307, name: "Temporary Redirect", meaning: "Temporary redirect preserving the method", category: "3xx" },
  { code: 308, name: "Permanent Redirect", meaning: "Permanent redirect preserving the method", category: "3xx" },
  { code: 400, name: "Bad Request", meaning: "Malformed or invalid request", category: "4xx" },
  { code: 401, name: "Unauthorized", meaning: "Authentication required or failed", category: "4xx" },
  { code: 402, name: "Payment Required", meaning: "Reserved for future use", category: "4xx" },
  { code: 403, name: "Forbidden", meaning: "Server refuses to authorize request", category: "4xx" },
  { code: 404, name: "Not Found", meaning: "Resource does not exist", category: "4xx" },
  { code: 405, name: "Method Not Allowed", meaning: "HTTP method not supported", category: "4xx" },
  { code: 406, name: "Not Acceptable", meaning: "Cannot satisfy content negotiation", category: "4xx" },
  { code: 407, name: "Proxy Authentication Required", meaning: "Proxy authentication required", category: "4xx" },
  { code: 408, name: "Request Timeout", meaning: "Server timed out waiting", category: "4xx" },
  { code: 409, name: "Conflict", meaning: "Request conflicts with current state", category: "4xx" },
  { code: 410, name: "Gone", meaning: "Resource permanently removed", category: "4xx" },
  { code: 411, name: "Length Required", meaning: "Content-Length header required", category: "4xx" },
  { code: 412, name: "Precondition Failed", meaning: "Server-side precondition failed", category: "4xx" },
  { code: 413, name: "Payload Too Large", meaning: "Request body too large", category: "4xx" },
  { code: 414, name: "URI Too Long", meaning: "Request URL too long", category: "4xx" },
  { code: 415, name: "Unsupported Media Type", meaning: "Content type not supported", category: "4xx" },
  { code: 418, name: "I'm a teapot", meaning: "Server refuses to brew coffee", category: "4xx" },
  { code: 421, name: "Misdirected Request", meaning: "Request sent to wrong server", category: "4xx" },
  { code: 422, name: "Unprocessable Entity", meaning: "Request understood but invalid", category: "4xx" },
  { code: 423, name: "Locked", meaning: "Resource is locked", category: "4xx" },
  { code: 425, name: "Too Early", meaning: "Server refuses too-early request", category: "4xx" },
  { code: 426, name: "Upgrade Required", meaning: "Client must switch protocols", category: "4xx" },
  { code: 428, name: "Precondition Required", meaning: "Precondition header required", category: "4xx" },
  { code: 429, name: "Too Many Requests", meaning: "Rate limit exceeded", category: "4xx" },
  { code: 431, name: "Request Header Fields Too Large", meaning: "Request headers too large", category: "4xx" },
  { code: 451, name: "Unavailable For Legal Reasons", meaning: "Blocked for legal reasons", category: "4xx" },
  { code: 500, name: "Internal Server Error", meaning: "Generic server-side failure", category: "5xx" },
  { code: 501, name: "Not Implemented", meaning: "Method not supported by server", category: "5xx" },
  { code: 502, name: "Bad Gateway", meaning: "Invalid upstream response", category: "5xx" },
  { code: 503, name: "Service Unavailable", meaning: "Server temporarily unavailable", category: "5xx" },
  { code: 504, name: "Gateway Timeout", meaning: "Upstream server timed out", category: "5xx" },
  { code: 505, name: "HTTP Version Not Supported", meaning: "HTTP version unsupported", category: "5xx" },
  { code: 506, name: "Variant Also Negotiates", meaning: "Content negotiation loop", category: "5xx" },
  { code: 507, name: "Insufficient Storage", meaning: "Server storage full", category: "5xx" },
  { code: 508, name: "Loop Detected", meaning: "Infinite loop detected", category: "5xx" },
  { code: 511, name: "Network Authentication Required", meaning: "Network access requires authentication", category: "5xx" },
];

export function lookup(code: number | string): StatusCode | undefined {
  const num = typeof code === "string" ? Number.parseInt(code, 10) : code;
  if (Number.isNaN(num)) return undefined;
  return STATUS_CODES.find((s) => s.code === num);
}

export function search(query: string): StatusCode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STATUS_CODES.filter((s) => {
    return (
      String(s.code).includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q)
    );
  });
}

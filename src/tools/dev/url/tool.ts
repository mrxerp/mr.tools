export interface QueryParam {
  key: string;
  value: string;
}

export interface UrlParts {
  scheme: string;
  username?: string;
  password?: string;
  hostname: string;
  port?: string;
  pathname: string;
  query: QueryParam[];
  fragment?: string;
  raw: string;
}

function decodeComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error("Malformed percent-encoding in URL");
  }
}

export function parseUrl(input: string): UrlParts {
  const raw = input.trim();
  if (!raw) throw new Error("URL is empty");
  if (/\s/.test(raw)) throw new Error("URL contains spaces");

  const hashIdx = raw.indexOf("#");
  let fragment: string | undefined;
  let rest = raw;
  if (hashIdx !== -1) {
    fragment = rest.slice(hashIdx + 1);
    rest = rest.slice(0, hashIdx);
  }

  const queryIdx = rest.indexOf("?");
  let queryStr = "";
  if (queryIdx !== -1) {
    queryStr = rest.slice(queryIdx + 1);
    rest = rest.slice(0, queryIdx);
  }

  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(rest);
  if (!schemeMatch) throw new Error("URL is missing a scheme");
  const scheme = schemeMatch[1].toLowerCase();

  let authority = "";
  let pathname = rest.slice(schemeMatch[0].length);
  if (pathname.startsWith("//")) {
    const slashIdx = pathname.indexOf("/", 2);
    if (slashIdx === -1) {
      authority = pathname.slice(2);
      pathname = "";
    } else {
      authority = pathname.slice(2, slashIdx);
      pathname = pathname.slice(slashIdx);
    }
  }

  let hostname = "";
  let port: string | undefined;
  let username: string | undefined;
  let password: string | undefined;
  if (authority) {
    let host = authority;
    const atIdx = host.lastIndexOf("@");
    if (atIdx !== -1) {
      const userinfo = host.slice(0, atIdx);
      host = host.slice(atIdx + 1);
      const colonIdx = userinfo.indexOf(":");
      if (colonIdx !== -1) {
        username = userinfo.slice(0, colonIdx);
        password = userinfo.slice(colonIdx + 1);
      } else {
        username = userinfo;
      }
    }
    if (host.startsWith("[")) {
      const close = host.indexOf("]");
      if (close === -1) throw new Error("Unbalanced brackets in host");
      hostname = host.slice(0, close + 1);
      const after = host.slice(close + 1);
      if (after.startsWith(":")) port = after.slice(1);
      else if (after) throw new Error("Invalid authority");
    } else {
      const colonIdx = host.lastIndexOf(":");
      if (colonIdx !== -1) {
        hostname = host.slice(0, colonIdx);
        port = host.slice(colonIdx + 1);
      } else {
        hostname = host;
      }
    }
  }

  const query = queryStr
    .split("&")
    .filter((pair) => pair !== "")
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq === -1) return { key: decodeComponent(pair), value: "" };
      return {
        key: decodeComponent(pair.slice(0, eq)),
        value: decodeComponent(pair.slice(eq + 1)),
      };
    });

  return {
    scheme,
    username,
    password,
    hostname,
    port,
    pathname: pathname ? decodeComponent(pathname) : "",
    query,
    fragment,
    raw,
  };
}

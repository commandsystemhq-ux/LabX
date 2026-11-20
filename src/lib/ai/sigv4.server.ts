/**
 * AWS Signature Version 4 for a single JSON POST (server only, Web Crypto, no SDK).
 * The path passed in is the path exactly as sent on the wire (already percent-encoded once); SigV4
 * for non-S3 services encodes each segment a second time in the canonical request, which is what
 * makes Bedrock model ids containing `:` or ARNs containing `/` sign correctly.
 */

const encoder = new TextEncoder();

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256Hex(data: string) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(data)));
}

async function hmac(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const raw = typeof key === "string" ? encoder.encode(key) : key;
  const k = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return crypto.subtle.sign("HMAC", k, encoder.encode(data));
}

/** RFC 3986 encoding as SigV4 defines it (encodeURIComponent leaves `!'()*` unescaped). */
const uriEncode = (s: string) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export interface SignInput {
  method: "POST" | "GET";
  host: string;
  /** Path as sent on the wire, e.g. `/model/anthropic.claude-3%3A0/converse`. */
  path: string;
  /** Raw query string without `?` (already encoded), or empty. */
  query?: string;
  /** Extra headers to sign and send (lower-case names), e.g. content-type. */
  headers: Record<string, string>;
  body: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | undefined;
  now: Date;
}

/** Returns the headers to send: the given ones plus x-amz-date, authorization and the token. */
export async function signV4(input: SignInput): Promise<Record<string, string>> {
  const amzDate = input.now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);

  const toSign: Record<string, string> = {
    ...input.headers,
    host: input.host,
    "x-amz-date": amzDate,
    ...(input.sessionToken ? { "x-amz-security-token": input.sessionToken } : {}),
  };
  const names = Object.keys(toSign)
    .map((n) => n.toLowerCase())
    .sort();
  const lowered = Object.fromEntries(Object.entries(toSign).map(([k, v]) => [k.toLowerCase(), v]));
  const canonicalHeaders = names
    .map((n) => `${n}:${(lowered[n] ?? "").trim().replace(/\s+/g, " ")}\n`)
    .join("");
  const signedHeaders = names.join(";");

  const canonicalPath = input.path
    .split("/")
    .map((seg) => uriEncode(seg))
    .join("/");
  const canonicalQuery = (input.query ?? "")
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const [k = "", v = ""] = pair.split("=");
      return [k, v] as const;
    })
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [
    input.method,
    canonicalPath,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    await sha256Hex(input.body),
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(canonicalRequest)].join(
    "\n",
  );

  const kDate = await hmac(`AWS4${input.secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, input.region);
  const kService = await hmac(kRegion, input.service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = hex(await hmac(kSigning, stringToSign));

  // `host` is set by fetch itself, so it is signed but not sent explicitly.
  const send = { ...lowered };
  delete send["host"];
  return {
    ...send,
    authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

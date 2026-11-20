/**
 * AES-256-GCM helpers for AI provider settings stored in Supabase.
 * The key lives only in the server environment (AI_SETTINGS_ENCRYPTION_KEY, 32 random bytes,
 * base64). Each value gets a fresh random IV and is bound to a context string, so a ciphertext
 * copied into another column fails to decrypt.
 */

const VERSION = "v1";
const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(text: string) {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** True for a base64 string that decodes to exactly 32 bytes. */
export function isValidEncryptionKey(keyB64: unknown): keyB64 is string {
  if (typeof keyB64 !== "string" || keyB64.trim().length < 40) return false;
  try {
    return fromBase64(keyB64.trim()).length === 32;
  } catch {
    return false;
  }
}

async function importKey(keyB64: string) {
  if (!isValidEncryptionKey(keyB64)) throw new Error("invalid encryption key");
  return crypto.subtle.importKey("raw", fromBase64(keyB64.trim()), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptJson(value: unknown, keyB64: string, context: string) {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(context) },
    key,
    data,
  );
  return `${VERSION}.${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

/** Returns the parsed value, or null for anything malformed / tampered / wrong key or context. */
export async function decryptJson(
  token: string,
  keyB64: string,
  context: string,
): Promise<unknown> {
  try {
    const [version, ivB64, dataB64] = token.split(".");
    if (version !== VERSION || !ivB64 || !dataB64) return null;
    const key = await importKey(keyB64);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivB64), additionalData: encoder.encode(context) },
      key,
      fromBase64(dataB64),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as unknown;
  } catch {
    return null;
  }
}

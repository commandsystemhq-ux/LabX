import { z } from "zod";
import type { UiKey } from "./i18n";

export type AuthMode = "signin" | "signup";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8).max(72);
const nameSchema = z.string().trim().min(1).max(50);

export interface Credentials {
  email: string;
  password: string;
  name?: string;
}

export type CredentialsCheck =
  | { ok: true; data: Credentials }
  | { ok: false; field: "email" | "password" | "name"; error: UiKey };

/** Client-side validation. The server (Supabase) remains the source of truth. */
export function validateCredentials(
  mode: AuthMode,
  input: { email: string; password: string; name: string },
): CredentialsCheck {
  const email = emailSchema.safeParse(input.email);
  if (!email.success) return { ok: false, field: "email", error: "authErrEmail" };

  const password = passwordSchema.safeParse(input.password);
  if (!password.success) {
    // Signing in with an existing short password is allowed to reach the server.
    if (mode === "signup" || input.password.length === 0 || input.password.length > 72) {
      return { ok: false, field: "password", error: "authErrPassword" };
    }
  }

  if (mode === "signup") {
    const name = nameSchema.safeParse(input.name);
    if (!name.success) return { ok: false, field: "name", error: "authErrName" };
    return { ok: true, data: { email: email.data, password: input.password, name: name.data } };
  }
  return { ok: true, data: { email: email.data, password: input.password } };
}

/** Map a Supabase auth error to a translated UI message key (never show raw server text). */
export function authErrorKey(error: unknown): UiKey {
  const e = (error ?? {}) as { code?: unknown; name?: unknown; status?: unknown };
  switch (e.code) {
    case "invalid_credentials":
      return "authErrInvalid";
    case "user_already_exists":
    case "email_exists":
      return "authErrExists";
    case "weak_password":
      return "authErrPassword";
    case "email_not_confirmed":
      return "authErrUnconfirmed";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "authErrRate";
  }
  if (e.status === 429) return "authErrRate";
  if (e.name === "AuthRetryableFetchError" || e.status === 0) return "authErrNetwork";
  return "authErrGeneric";
}

/** Only same-origin absolute paths are allowed as post-login destinations (no open redirect). */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 200) return undefined;
  if (!/^\/(?![/\\])[\w\-./?=&%]*$/.test(value)) return undefined;
  if (value.startsWith("/auth")) return undefined;
  return value;
}

/** Display name from account metadata, falling back to the email's local part. */
export function displayNameOf(user: {
  email?: string | undefined;
  user_metadata?: Record<string, unknown> | undefined;
}): string {
  const clean = (s: string) =>
    [...s]
      .filter((ch) => ch.charCodeAt(0) > 0x1f && ch.charCodeAt(0) !== 0x7f)
      .join("")
      .trim()
      .slice(0, 50);
  const meta = user.user_metadata?.["display_name"];
  if (typeof meta === "string" && clean(meta)) return clean(meta);
  const local = user.email?.split("@")[0];
  return local ? clean(local) : "";
}

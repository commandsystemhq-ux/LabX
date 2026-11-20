import { describe, expect, it } from "vitest";
import { authErrorKey, displayNameOf, safeRedirect, validateCredentials } from "@/lib/auth-utils";
import { parseSupabaseEnv } from "@/lib/supabase";

const jwt = (role: string) => `h.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.s`;

describe("parseSupabaseEnv", () => {
  it("accepts an https url with a publishable key and trims it", () => {
    expect(parseSupabaseEnv(" https://abc.supabase.co/ ", jwt("anon"))).toEqual({
      url: "https://abc.supabase.co",
      key: jwt("anon"),
    });
    expect(parseSupabaseEnv("https://abc.supabase.co", "sb_publishable_x")).not.toBeNull();
    expect(parseSupabaseEnv("http://localhost:54321", jwt("anon"))).not.toBeNull();
  });

  it("turns the feature off for missing, insecure or malformed values", () => {
    expect(parseSupabaseEnv(undefined, undefined)).toBeNull();
    expect(parseSupabaseEnv("", jwt("anon"))).toBeNull();
    expect(parseSupabaseEnv("https://abc.supabase.co", "  ")).toBeNull();
    expect(parseSupabaseEnv("http://abc.supabase.co", jwt("anon"))).toBeNull();
    expect(parseSupabaseEnv("javascript:alert(1)", jwt("anon"))).toBeNull();
    expect(parseSupabaseEnv("not a url", jwt("anon"))).toBeNull();
  });

  it("never accepts a service-role / secret key in the browser", () => {
    expect(parseSupabaseEnv("https://abc.supabase.co", jwt("service_role"))).toBeNull();
    expect(parseSupabaseEnv("https://abc.supabase.co", "sb_secret_abc")).toBeNull();
  });
});

describe("validateCredentials", () => {
  const ok = { email: " Student@Example.com ", password: "correct-horse", name: " Sara " };

  it("normalises a valid sign-up and sign-in", () => {
    expect(validateCredentials("signup", ok)).toEqual({
      ok: true,
      data: { email: "student@example.com", password: "correct-horse", name: "Sara" },
    });
    expect(validateCredentials("signin", ok)).toEqual({
      ok: true,
      data: { email: "student@example.com", password: "correct-horse" },
    });
  });

  it("reports the first invalid field with a translatable key", () => {
    expect(validateCredentials("signin", { ...ok, email: "nope" })).toMatchObject({
      field: "email",
      error: "authErrEmail",
    });
    expect(validateCredentials("signup", { ...ok, password: "short" })).toMatchObject({
      field: "password",
      error: "authErrPassword",
    });
    expect(validateCredentials("signup", { ...ok, name: "   " })).toMatchObject({
      field: "name",
      error: "authErrName",
    });
    expect(validateCredentials("signin", { ...ok, password: "" })).toMatchObject({
      field: "password",
    });
    expect(validateCredentials("signin", { ...ok, password: "x".repeat(73) })).toMatchObject({
      field: "password",
    });
  });

  it("lets a short legacy password reach the server when signing in", () => {
    expect(validateCredentials("signin", { ...ok, password: "abc" }).ok).toBe(true);
  });
});

describe("authErrorKey", () => {
  it("maps known Supabase errors and never leaks raw messages", () => {
    expect(authErrorKey({ code: "invalid_credentials" })).toBe("authErrInvalid");
    expect(authErrorKey({ code: "user_already_exists" })).toBe("authErrExists");
    expect(authErrorKey({ code: "weak_password" })).toBe("authErrPassword");
    expect(authErrorKey({ code: "email_not_confirmed" })).toBe("authErrUnconfirmed");
    expect(authErrorKey({ status: 429 })).toBe("authErrRate");
    expect(authErrorKey({ name: "AuthRetryableFetchError", status: 0 })).toBe("authErrNetwork");
    expect(authErrorKey({ message: "database exploded" })).toBe("authErrGeneric");
    expect(authErrorKey(null)).toBe("authErrGeneric");
  });
});

describe("safeRedirect", () => {
  it("allows only same-origin app paths", () => {
    expect(safeRedirect("/dashboard?grade=g12&subject=physics")).toBe(
      "/dashboard?grade=g12&subject=physics",
    );
    expect(safeRedirect("/lesson?id=g12-physics-u1-l2")).toBe("/lesson?id=g12-physics-u1-l2");
  });

  it("rejects open-redirect and loop attempts", () => {
    for (const bad of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "dashboard",
      "/auth?mode=signup",
      "/x".repeat(150),
      42,
      undefined,
    ]) {
      expect(safeRedirect(bad)).toBeUndefined();
    }
  });
});

describe("displayNameOf", () => {
  it("prefers the sanitised display name, then the email local part", () => {
    expect(
      displayNameOf({ email: "a@b.co", user_metadata: { display_name: " Sara\u0000 " } }),
    ).toBe("Sara");
    expect(displayNameOf({ email: "sara@b.co", user_metadata: { display_name: 5 } })).toBe("sara");
    expect(
      displayNameOf({ email: "x@b.co", user_metadata: { display_name: "y".repeat(80) } }),
    ).toHaveLength(50);
    expect(displayNameOf({})).toBe("");
  });
});

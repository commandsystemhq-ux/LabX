import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { LogOut, MailCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { safeRedirect, validateCredentials, type AuthMode } from "@/lib/auth-utils";
import { useLang, type UiKey } from "@/lib/i18n";

interface AuthSearch {
  mode?: AuthMode | undefined;
  redirect?: string | undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode:
      search["mode"] === "signup" ? "signup" : search["mode"] === "signin" ? "signin" : undefined,
    redirect: safeRedirect(search["redirect"]),
  }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — LabX" },
      {
        name: "description",
        content: "Sign in or create your LabX account to save your progress.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type FieldError = { field: "email" | "password" | "name" | "form"; key: UiKey } | null;

function AuthPage() {
  const search = Route.useSearch();
  const mode: AuthMode = search.mode ?? "signin";
  const { t } = useLang();
  const { status, user, configured, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate({ from: "/auth" });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FieldError>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const setMode = (next: AuthMode) => {
    setError(null);
    setConfirmSent(false);
    void navigate({ search: (prev) => ({ ...prev, mode: next }), replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const check = validateCredentials(mode, { email, password, name });
    if (!check.ok) {
      setError({ field: check.field, key: check.error });
      return;
    }
    setError(null);
    setBusy(true);
    const result = await (mode === "signup" ? signUp(check.data) : signIn(check.data));
    setBusy(false);
    if (!result.ok) {
      setError({ field: "form", key: result.error });
      return;
    }
    setPassword("");
    if (result.needsConfirmation) {
      setConfirmSent(true);
      return;
    }
    if (search.redirect) router.history.push(search.redirect);
    else void navigate({ to: "/dashboard" });
  };

  const errorFor = (field: NonNullable<FieldError>["field"]) =>
    error?.field === field ? t(error.key) : null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-10 sm:pt-16">
        <div className="glass animate-fade-up rounded-3xl p-6 sm:p-8">
          {status === "loading" ? (
            <p role="status" className="text-center text-sm text-muted-foreground">
              {t("authLoading")}
            </p>
          ) : user ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-subject text-primary-foreground">
                <UserRound className="size-7" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{t("authSignedInAs")}</p>
                <p className="mt-1 text-lg font-bold">{user.name || user.email}</p>
                <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {user.email}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button asChild variant="hero" className="flex-1 rounded-full">
                  <Link to="/dashboard">{t("dashboard")}</Link>
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  className="flex-1 rounded-full"
                  onClick={() => void signOut()}
                >
                  <LogOut /> {t("signOut")}
                </Button>
              </div>
            </div>
          ) : !configured ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-bold">{t("authWelcome")}</h1>
              <p role="status" className="mt-3 text-sm text-muted-foreground">
                {t("authNotConfigured")}
              </p>
              <Button asChild variant="hero" className="mt-5 rounded-full">
                <Link to="/dashboard">{t("dashboard")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">
                {mode === "signup" ? t("signUp") : t("signIn")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("authSubtitle")}</p>

              {confirmSent && (
                <p
                  role="status"
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-bio/40 bg-bio/10 p-3 text-sm"
                >
                  <MailCheck className="mt-0.5 size-4 shrink-0 text-bio" />
                  {t("authCheckEmail")}
                </p>
              )}

              <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
                {mode === "signup" && (
                  <Field id="auth-name" label={t("displayName")} error={errorFor("name")}>
                    <Input
                      id="auth-name"
                      autoComplete="name"
                      maxLength={50}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={error?.field === "name"}
                      aria-describedby={error?.field === "name" ? "auth-name-error" : undefined}
                    />
                  </Field>
                )}
                <Field id="auth-email" label={t("email")} error={errorFor("email")}>
                  <Input
                    id="auth-email"
                    type="email"
                    dir="ltr"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={error?.field === "email"}
                    aria-describedby={error?.field === "email" ? "auth-email-error" : undefined}
                  />
                </Field>
                <Field id="auth-password" label={t("password")} error={errorFor("password")}>
                  <Input
                    id="auth-password"
                    type="password"
                    dir="ltr"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    maxLength={72}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error?.field === "password"}
                    aria-describedby={
                      error?.field === "password" ? "auth-password-error" : undefined
                    }
                  />
                </Field>

                {error?.field === "form" && (
                  <p
                    role="alert"
                    className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
                  >
                    {t(error.key)}
                  </p>
                )}

                <Button type="submit" variant="hero" className="rounded-full" disabled={busy}>
                  {busy ? t("authLoading") : mode === "signup" ? t("signUp") : t("signIn")}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {mode === "signup" ? t("haveAccount") : t("noAccount")}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

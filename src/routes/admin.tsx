import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  azureInput,
  bedrockInput,
  DEFAULT_AZURE_API_VERSION,
  type AiProvider,
  type AiTestResult,
  type PublicAiSettings,
} from "@/lib/ai-config";
import {
  adminGetAiSettingsFn,
  adminSaveAiSettingsFn,
  adminTestAiFn,
} from "@/lib/ai-tutor.functions";
import { useAuth } from "@/lib/auth";
import { useLang, type UiKey } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "إدارة المعلم الذكي — LabX" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

type Load = "idle" | "loading" | "ready" | "forbidden" | "error";

interface Form {
  enabled: boolean;
  provider: AiProvider;
  bedrockRegion: string;
  bedrockModel: string;
  bedrockKey: string;
  azureEndpoint: string;
  azureDeployment: string;
  azureVersion: string;
  azureRegion: string;
  azureKey: string;
}

const emptyForm: Form = {
  enabled: false,
  provider: "bedrock",
  bedrockRegion: "",
  bedrockModel: "",
  bedrockKey: "",
  azureEndpoint: "",
  azureDeployment: "",
  azureVersion: DEFAULT_AZURE_API_VERSION,
  azureRegion: "",
  azureKey: "",
};

function toForm(s: PublicAiSettings): Form {
  return {
    enabled: s.enabled,
    provider: s.activeProvider,
    bedrockRegion: s.bedrock?.region ?? "",
    bedrockModel: s.bedrock?.modelId ?? "",
    bedrockKey: "",
    azureEndpoint: s.azure?.endpoint ?? "",
    azureDeployment: s.azure?.deployment ?? "",
    azureVersion: s.azure?.apiVersion ?? DEFAULT_AZURE_API_VERSION,
    azureRegion: s.azure?.region ?? "",
    azureKey: "",
  };
}

/** Plain free-text entry: no suggestion lists, no browser autofill / autocorrect on these fields. */
const freeText = {
  autoComplete: "off",
  autoCapitalize: "off",
  autoCorrect: "off",
  spellCheck: false,
} as const;

function AdminPage() {
  const { t, lang } = useLang();
  const { status, user, getAccessToken } = useAuth();
  const [load, setLoad] = useState<Load>("idle");
  const [settings, setSettings] = useState<PublicAiSettings | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; key: UiKey } | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<AiTestResult | null>(null);

  const isAdmin = user?.isAdmin === true;

  const refresh = useCallback(async () => {
    setLoad("loading");
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return setLoad("forbidden");
      const res = await adminGetAiSettingsFn({ data: { accessToken } });
      if (res.ok) {
        setSettings(res.data);
        setForm(toForm(res.data));
        setLoad("ready");
      } else {
        setLoad(res.reason === "forbidden" || res.reason === "auth" ? "forbidden" : "error");
      }
    } catch {
      setLoad("error");
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoad("forbidden");
      return;
    }
    void refresh();
  }, [status, isAdmin, refresh]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setNotice(null);
    setBadFields((b) => b.filter((x) => !x.startsWith(String(key))));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !settings) return;

    const bad: string[] = [];
    const hasBedrock = form.bedrockRegion.trim() || form.bedrockModel.trim() || form.bedrockKey;
    const hasAzure = form.azureEndpoint.trim() || form.azureDeployment.trim() || form.azureKey;

    const bedrock = hasBedrock
      ? bedrockInput.safeParse({
          region: form.bedrockRegion,
          modelId: form.bedrockModel,
          ...(form.bedrockKey ? { apiKey: form.bedrockKey } : {}),
        })
      : null;
    if (bedrock && !bedrock.success) {
      for (const i of bedrock.error.issues) bad.push(`bedrock${String(i.path[0] ?? "")}`);
    }
    const azure = hasAzure
      ? azureInput.safeParse({
          endpoint: form.azureEndpoint,
          deployment: form.azureDeployment,
          apiVersion: form.azureVersion,
          region: form.azureRegion,
          ...(form.azureKey ? { apiKey: form.azureKey } : {}),
        })
      : null;
    if (azure && !azure.success) {
      for (const i of azure.error.issues) bad.push(`azure${String(i.path[0] ?? "")}`);
    }
    if (bad.length) {
      setBadFields(bad);
      setNotice({ tone: "error", key: "adminErrInvalid" });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("no session");
      const res = await adminSaveAiSettingsFn({
        data: {
          accessToken,
          enabled: form.enabled,
          activeProvider: form.provider,
          ...(bedrock?.success ? { bedrock: bedrock.data } : {}),
          ...(azure?.success ? { azure: azure.data } : {}),
        },
      });
      if (res.ok) {
        setSettings(res.data);
        setForm(toForm(res.data));
        setBadFields([]);
        setNotice({ tone: "ok", key: "adminSaved" });
      } else if (res.reason === "forbidden" || res.reason === "auth") {
        setLoad("forbidden");
      } else if (res.reason === "server_not_configured") {
        setNotice({ tone: "error", key: "adminServerNotReady" });
      } else if (res.reason === "invalid") {
        setBadFields((res.fields ?? []).map((f) => f.replace(".", "")));
        setNotice({ tone: "error", key: "adminErrNeedConfig" });
      } else {
        setNotice({ tone: "error", key: "adminErrGeneric" });
      }
    } catch {
      setNotice({ tone: "error", key: "adminErrGeneric" });
    } finally {
      setSaving(false);
    }
  };

  /** Tries the saved settings of the active provider and shows its real (redacted) error. */
  const runTest = async () => {
    if (testing || !settings) return;
    setTesting(true);
    setTest(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("no session");
      const res = await adminTestAiFn({ data: { accessToken } });
      if (res.ok) setTest(res.data);
      else if (res.reason === "forbidden" || res.reason === "auth") setLoad("forbidden");
      else setTest({ ok: false, reason: "provider_error", provider: settings.activeProvider });
    } catch {
      setTest({ ok: false, reason: "provider_error", provider: settings.activeProvider });
    } finally {
      setTesting(false);
    }
  };

  const bad = (name: string) => badFields.includes(name);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
          <ShieldCheck className="size-7 text-phys" />
          {t("adminTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("adminSubtitle")}</p>

        {status === "loading" || load === "loading" || load === "idle" ? (
          <p role="status" className="glass mt-6 rounded-2xl p-4 text-sm">
            {t("authLoading")}
          </p>
        ) : load === "forbidden" ? (
          <div role="alert" className="glass mt-6 rounded-2xl p-5 text-sm">
            <p>{user ? t("adminForbidden") : t("adminSignInFirst")}</p>
            <Button asChild variant="glass" className="mt-4 rounded-full">
              {user ? (
                <Link to="/dashboard">{t("dashboard")}</Link>
              ) : (
                <Link to="/auth" search={{ mode: "signin", redirect: "/admin" }}>
                  {t("signIn")}
                </Link>
              )}
            </Button>
          </div>
        ) : load === "error" || !settings ? (
          <div role="alert" className="glass mt-6 rounded-2xl p-5 text-sm">
            <p>{t("adminLoadError")}</p>
            <Button
              type="button"
              variant="glass"
              className="mt-4 rounded-full"
              onClick={() => void refresh()}
            >
              {t("adminRetry")}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
            {!settings.serverReady && (
              <p
                role="alert"
                className="rounded-2xl border border-warning/50 bg-warning/10 p-4 text-sm"
              >
                {t("adminServerNotReady")}
              </p>
            )}

            <section className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="ai-enabled" className="text-base font-bold">
                    {t("adminTutorSwitch")}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">{t("adminTutorSwitchHint")}</p>
                </div>
                <Switch
                  id="ai-enabled"
                  checked={form.enabled}
                  onCheckedChange={(v) => set("enabled", v)}
                />
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-bold">{t("adminProvider")}</legend>
                <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["bedrock", "adminBedrock"],
                      ["azure", "adminAzure"],
                    ] as const
                  ).map(([id, label]) => (
                    <label
                      key={id}
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition-colors " +
                        (form.provider === id
                          ? "border-subject bg-subject/10"
                          : "border-border hover:bg-accent/40")
                      }
                    >
                      <input
                        type="radio"
                        name="ai-provider"
                        value={id}
                        checked={form.provider === id}
                        onChange={() => set("provider", id)}
                        className="size-4 accent-[var(--subject)]"
                      />
                      {t(label)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section
              className={
                "glass rounded-3xl p-5 " + (form.provider === "bedrock" ? "" : "opacity-80")
              }
            >
              <h2 className="text-base font-bold">{t("adminBedrock")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field id="br-region" label={t("adminRegion")} invalid={bad("bedrockregion")}>
                  <Input
                    id="br-region"
                    dir="ltr"
                    {...freeText}
                    maxLength={30}
                    value={form.bedrockRegion}
                    onChange={(e) => set("bedrockRegion", e.target.value)}
                    aria-invalid={bad("bedrockregion")}
                  />
                </Field>
                <Field
                  id="br-model"
                  label={t("adminModelId")}
                  hint={t("adminModelHint")}
                  invalid={bad("bedrockmodelId")}
                >
                  <Input
                    id="br-model"
                    dir="ltr"
                    {...freeText}
                    maxLength={200}
                    value={form.bedrockModel}
                    onChange={(e) => set("bedrockModel", e.target.value)}
                    aria-invalid={bad("bedrockmodelId")}
                  />
                </Field>
                <Field
                  id="br-key"
                  label={t("adminApiKey")}
                  hint={t("adminBedrockKeyHint")}
                  invalid={bad("bedrockapiKey") || bad("bedrock")}
                  wide
                >
                  <Input
                    id="br-key"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    maxLength={512}
                    value={form.bedrockKey}
                    placeholder={settings.bedrock?.hasKey ? t("adminApiKeyKept") : ""}
                    onChange={(e) => set("bedrockKey", e.target.value)}
                    aria-invalid={bad("bedrockapiKey")}
                  />
                </Field>
              </div>
            </section>

            <section
              className={"glass rounded-3xl p-5 " + (form.provider === "azure" ? "" : "opacity-80")}
            >
              <h2 className="text-base font-bold">{t("adminAzure")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="az-endpoint"
                  label={t("adminEndpoint")}
                  hint={t("adminEndpointHint")}
                  invalid={bad("azureendpoint")}
                  wide
                >
                  <Input
                    id="az-endpoint"
                    type="url"
                    dir="ltr"
                    {...freeText}
                    maxLength={200}
                    value={form.azureEndpoint}
                    onChange={(e) => set("azureEndpoint", e.target.value)}
                    aria-invalid={bad("azureendpoint")}
                  />
                </Field>
                <Field
                  id="az-deployment"
                  label={t("adminDeployment")}
                  invalid={bad("azuredeployment")}
                >
                  <Input
                    id="az-deployment"
                    dir="ltr"
                    {...freeText}
                    maxLength={64}
                    value={form.azureDeployment}
                    onChange={(e) => set("azureDeployment", e.target.value)}
                    aria-invalid={bad("azuredeployment")}
                  />
                </Field>
                <Field
                  id="az-version"
                  label={t("adminApiVersion")}
                  invalid={bad("azureapiVersion")}
                >
                  <Input
                    id="az-version"
                    dir="ltr"
                    {...freeText}
                    maxLength={20}
                    value={form.azureVersion}
                    onChange={(e) => set("azureVersion", e.target.value)}
                    aria-invalid={bad("azureapiVersion")}
                  />
                </Field>
                <Field id="az-region" label={t("adminAzureRegion")} invalid={bad("azureregion")}>
                  <Input
                    id="az-region"
                    dir="ltr"
                    {...freeText}
                    maxLength={40}
                    value={form.azureRegion}
                    onChange={(e) => set("azureRegion", e.target.value)}
                    aria-invalid={bad("azureregion")}
                  />
                </Field>
                <Field
                  id="az-key"
                  label={t("adminApiKey")}
                  invalid={bad("azureapiKey") || bad("azure")}
                >
                  <Input
                    id="az-key"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    maxLength={512}
                    value={form.azureKey}
                    placeholder={settings.azure?.hasKey ? t("adminApiKeyKept") : ""}
                    onChange={(e) => set("azureKey", e.target.value)}
                    aria-invalid={bad("azureapiKey")}
                  />
                </Field>
              </div>
            </section>

            <section className="glass rounded-3xl p-5">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Activity className="size-4 text-subject" />
                {t("adminUsage")}
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat
                  label={t("adminRequests")}
                  value={settings.usage.requests.toLocaleString("en-US")}
                />
                <Stat
                  label={t("adminErrors")}
                  value={settings.usage.errors.toLocaleString("en-US")}
                />
                <Stat
                  label={t("adminLastUsed")}
                  value={
                    settings.usage.lastUsedAt
                      ? new Date(settings.usage.lastUsedAt).toLocaleString(
                          lang === "ar" ? "ar-EG" : "en-US",
                        )
                      : t("adminNever")
                  }
                />
                <Stat label={t("adminProvider")} value={settings.usage.lastProvider ?? "—"} />
              </dl>
            </section>

            {notice && (
              <p
                role={notice.tone === "error" ? "alert" : "status"}
                className={
                  "rounded-2xl border p-3 text-sm " +
                  (notice.tone === "error"
                    ? "border-destructive/40 bg-destructive/10"
                    : "border-bio/40 bg-bio/10")
                }
              >
                {t(notice.key)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="hero"
                className="rounded-full px-6"
                disabled={saving || !settings.serverReady}
              >
                {saving ? t("adminSaving") : t("adminSave")}
              </Button>
              <Button
                type="button"
                variant="glass"
                className="rounded-full px-6"
                disabled={testing || saving || !settings.serverReady}
                onClick={() => void runTest()}
              >
                {testing ? t("adminTesting") : t("adminTest")}
              </Button>
              <p className="text-[11px] text-muted-foreground">{t("adminTestHint")}</p>
            </div>

            {test && (
              <div
                role={test.ok ? "status" : "alert"}
                className={
                  "rounded-2xl border p-3 text-sm " +
                  (test.ok ? "border-bio/40 bg-bio/10" : "border-destructive/40 bg-destructive/10")
                }
              >
                {test.ok ? (
                  <p>
                    {t("adminTestOk")}{" "}
                    <span className="font-mono text-xs" dir="ltr">
                      {test.provider} · {test.ms} ms
                    </span>
                  </p>
                ) : test.reason === "not_configured" ? (
                  <p>{t("adminTestNotConfigured")}</p>
                ) : (
                  <div>
                    <p className="font-bold">
                      {t("adminTestFail")}{" "}
                      <span className="font-mono text-xs" dir="ltr">
                        {test.provider}
                        {test.status ? ` · HTTP ${test.status}` : ""}
                      </span>
                    </p>
                    {test.detail && (
                      <p className="mt-1 break-words font-mono text-xs" dir="ltr">
                        {test.detail}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  invalid,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  invalid: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (wide ? "sm:col-span-2" : "")}>
      <Label htmlFor={id} className={invalid ? "text-destructive" : ""}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-mono font-bold">{value}</dd>
    </div>
  );
}

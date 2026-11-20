import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  azureInput,
  bedrockInput,
  bedrockModelWarning,
  DEFAULT_AZURE_API_VERSION,
  GENERATION,
  IAM_KEY_IN_API_KEY,
  type AiErrorHint,
  type AiProvider,
  type AiTestResult,
  type BedrockApiMode,
  type BedrockAuthMode,
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
  bedrockAuth: BedrockAuthMode;
  bedrockApiMode: BedrockApiMode;
  bedrockKey: string;
  bedrockAccessKeyId: string;
  bedrockSecretKey: string;
  bedrockSessionToken: string;
  bedrockClearSession: boolean;
  bedrockMaxTokens: string;
  bedrockTemperature: string;
  bedrockTimeout: string;
  bedrockInstructions: string;
  azureEndpoint: string;
  azureDeployment: string;
  azureVersion: string;
  azureRegion: string;
  azureKey: string;
  azureMaxTokens: string;
  azureTemperature: string;
  azureTimeout: string;
  azureInstructions: string;
}

const emptyForm: Form = {
  enabled: false,
  provider: "bedrock",
  bedrockRegion: "",
  bedrockModel: "",
  bedrockAuth: "apikey",
  bedrockApiMode: "converse",
  bedrockKey: "",
  bedrockAccessKeyId: "",
  bedrockSecretKey: "",
  bedrockSessionToken: "",
  bedrockClearSession: false,
  bedrockMaxTokens: String(GENERATION.maxTokens.def),
  bedrockTemperature: String(GENERATION.temperature.def),
  bedrockTimeout: String(GENERATION.timeoutSec.def),
  bedrockInstructions: "",
  azureEndpoint: "",
  azureDeployment: "",
  azureVersion: DEFAULT_AZURE_API_VERSION,
  azureRegion: "",
  azureKey: "",
  azureMaxTokens: String(GENERATION.maxTokens.def),
  azureTemperature: String(GENERATION.temperature.def),
  azureTimeout: String(GENERATION.timeoutSec.def),
  azureInstructions: "",
};

/** Empty = use the server default; anything else is parsed (NaN fails validation, flagging the field). */
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

const HINT_KEYS: Record<AiErrorHint, UiKey> = {
  inference_profile: "adminHintInferenceProfile",
  model_access: "adminHintModelAccess",
  model_invalid: "adminHintModelInvalid",
  bad_credentials: "adminHintBadCredentials",
  bad_signature: "adminHintBadSignature",
  deployment_not_found: "adminHintDeployment",
  bad_key: "adminHintBadKey",
  timeout: "adminHintTimeout",
};

function toForm(s: PublicAiSettings): Form {
  return {
    enabled: s.enabled,
    provider: s.activeProvider,
    bedrockRegion: s.bedrock?.region ?? "",
    bedrockModel: s.bedrock?.modelId ?? "",
    bedrockAuth: s.bedrock?.authMode ?? "apikey",
    bedrockApiMode: s.bedrock?.apiMode ?? "converse",
    bedrockKey: "",
    bedrockAccessKeyId: "",
    bedrockSecretKey: "",
    bedrockSessionToken: "",
    bedrockClearSession: false,
    bedrockMaxTokens: String(s.bedrock?.maxTokens ?? GENERATION.maxTokens.def),
    bedrockTemperature: String(s.bedrock?.temperature ?? GENERATION.temperature.def),
    bedrockTimeout: String(s.bedrock?.timeoutSec ?? GENERATION.timeoutSec.def),
    bedrockInstructions: s.bedrock?.extraInstructions ?? "",
    azureEndpoint: s.azure?.endpoint ?? "",
    azureDeployment: s.azure?.deployment ?? "",
    azureVersion: s.azure?.apiVersion ?? DEFAULT_AZURE_API_VERSION,
    azureRegion: s.azure?.region ?? "",
    azureKey: "",
    azureMaxTokens: String(s.azure?.maxTokens ?? GENERATION.maxTokens.def),
    azureTemperature: String(s.azure?.temperature ?? GENERATION.temperature.def),
    azureTimeout: String(s.azure?.timeoutSec ?? GENERATION.timeoutSec.def),
    azureInstructions: s.azure?.extraInstructions ?? "",
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
    if (key === "provider") setTest(null);
    setBadFields((b) => b.filter((x) => !x.startsWith(String(key))));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !settings) return;

    const bad: string[] = [];
    const iam = form.bedrockAuth === "iam";
    const hasBedrock =
      form.bedrockRegion.trim() ||
      form.bedrockModel.trim() ||
      form.bedrockKey ||
      form.bedrockAccessKeyId ||
      form.bedrockSecretKey;
    const hasAzure = form.azureEndpoint.trim() || form.azureDeployment.trim() || form.azureKey;

    // Only the chosen method's secrets are sent; blank secrets mean "keep the stored one".
    const bedrock = hasBedrock
      ? bedrockInput.safeParse({
          region: form.bedrockRegion,
          modelId: form.bedrockModel,
          authMode: form.bedrockAuth,
          apiMode: form.bedrockApiMode,
          ...(!iam && form.bedrockKey ? { apiKey: form.bedrockKey } : {}),
          ...(iam && form.bedrockAccessKeyId ? { accessKeyId: form.bedrockAccessKeyId } : {}),
          ...(iam && form.bedrockSecretKey ? { secretAccessKey: form.bedrockSecretKey } : {}),
          ...(iam && form.bedrockSessionToken ? { sessionToken: form.bedrockSessionToken } : {}),
          ...(iam && form.bedrockClearSession ? { clearSessionToken: true } : {}),
          maxTokens: num(form.bedrockMaxTokens),
          temperature: num(form.bedrockTemperature),
          timeoutSec: num(form.bedrockTimeout),
          extraInstructions: form.bedrockInstructions,
        })
      : null;
    let keyShape = false;
    if (bedrock && !bedrock.success) {
      for (const i of bedrock.error.issues) {
        bad.push(`bedrock${String(i.path[0] ?? "")}`);
        if (i.message === IAM_KEY_IN_API_KEY) keyShape = true;
      }
    }
    const azure = hasAzure
      ? azureInput.safeParse({
          endpoint: form.azureEndpoint,
          deployment: form.azureDeployment,
          apiVersion: form.azureVersion,
          region: form.azureRegion,
          ...(form.azureKey ? { apiKey: form.azureKey } : {}),
          maxTokens: num(form.azureMaxTokens),
          temperature: num(form.azureTemperature),
          timeoutSec: num(form.azureTimeout),
          extraInstructions: form.azureInstructions,
        })
      : null;
    if (azure && !azure.success) {
      for (const i of azure.error.issues) bad.push(`azure${String(i.path[0] ?? "")}`);
    }
    if (bad.length) {
      setBadFields(bad);
      setNotice({ tone: "error", key: keyShape ? "adminIamKeyInApiKey" : "adminErrInvalid" });
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

  /** Tries the SAVED settings of the selected provider and shows its real (redacted) error. */
  const runTest = async () => {
    if (testing || !settings) return;
    setTesting(true);
    setTest(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("no session");
      const res = await adminTestAiFn({ data: { accessToken, provider: form.provider } });
      if (res.ok) setTest(res.data);
      else if (res.reason === "forbidden" || res.reason === "auth") setLoad("forbidden");
      else setTest({ ok: false, reason: "provider_error", provider: form.provider });
    } catch {
      setTest({ ok: false, reason: "provider_error", provider: form.provider });
    } finally {
      setTesting(false);
    }
  };

  const bad = (name: string) => badFields.includes(name);
  const dirty = useMemo(
    () => (settings ? JSON.stringify(form) !== JSON.stringify(toForm(settings)) : false),
    [form, settings],
  );
  const modelWarning = bedrockModelWarning(form.bedrockRegion, form.bedrockModel);
  const iamSaved = settings?.bedrock?.authMode === "iam" && settings.bedrock.hasKey;

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
                {modelWarning && (
                  <p className="text-[11px] text-warning sm:col-span-2" role="note">
                    {t("adminModelMismatch")}
                  </p>
                )}
                <RadioRow
                  legend={t("adminApiMode")}
                  name="br-api-mode"
                  value={form.bedrockApiMode}
                  onChange={(v) => set("bedrockApiMode", v)}
                  options={[
                    ["converse", t("adminApiModeConverse")],
                    ["invoke", t("adminApiModeInvoke")],
                  ]}
                />
                <RadioRow
                  legend={t("adminAuthMethod")}
                  name="br-auth"
                  value={form.bedrockAuth}
                  onChange={(v) => set("bedrockAuth", v)}
                  options={[
                    ["apikey", t("adminAuthApiKey")],
                    ["iam", t("adminAuthIam")],
                  ]}
                />
                {form.bedrockAuth === "apikey" ? (
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
                      maxLength={4096}
                      value={form.bedrockKey}
                      placeholder={
                        settings.bedrock?.authMode === "apikey" && settings.bedrock.hasKey
                          ? t("adminApiKeyKept")
                          : ""
                      }
                      onChange={(e) => set("bedrockKey", e.target.value)}
                      aria-invalid={bad("bedrockapiKey")}
                    />
                  </Field>
                ) : (
                  <>
                    <p className="text-[11px] text-muted-foreground sm:col-span-2">
                      {t("adminIamHint")}
                    </p>
                    <Field
                      id="br-akid"
                      label={t("adminAccessKeyId")}
                      invalid={bad("bedrockaccessKeyId") || bad("bedrock")}
                    >
                      <Input
                        id="br-akid"
                        type="password"
                        dir="ltr"
                        autoComplete="new-password"
                        maxLength={128}
                        value={form.bedrockAccessKeyId}
                        placeholder={iamSaved ? t("adminApiKeyKept") : ""}
                        onChange={(e) => set("bedrockAccessKeyId", e.target.value)}
                        aria-invalid={bad("bedrockaccessKeyId")}
                      />
                    </Field>
                    <Field
                      id="br-secret"
                      label={t("adminSecretKey")}
                      invalid={bad("bedrocksecretAccessKey") || bad("bedrock")}
                    >
                      <Input
                        id="br-secret"
                        type="password"
                        dir="ltr"
                        autoComplete="new-password"
                        maxLength={128}
                        value={form.bedrockSecretKey}
                        placeholder={iamSaved ? t("adminApiKeyKept") : ""}
                        onChange={(e) => set("bedrockSecretKey", e.target.value)}
                        aria-invalid={bad("bedrocksecretAccessKey")}
                      />
                    </Field>
                    <Field
                      id="br-session"
                      label={t("adminSessionToken")}
                      invalid={bad("bedrocksessionToken")}
                      wide
                    >
                      <Input
                        id="br-session"
                        type="password"
                        dir="ltr"
                        autoComplete="new-password"
                        maxLength={4096}
                        value={form.bedrockSessionToken}
                        placeholder={
                          iamSaved && settings.bedrock?.hasSessionToken ? t("adminSessionKept") : ""
                        }
                        onChange={(e) => set("bedrockSessionToken", e.target.value)}
                        aria-invalid={bad("bedrocksessionToken")}
                      />
                      {iamSaved && settings.bedrock?.hasSessionToken && (
                        <label className="mt-1 flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={form.bedrockClearSession}
                            onChange={(e) => set("bedrockClearSession", e.target.checked)}
                            className="size-4 accent-[var(--subject)]"
                          />
                          {t("adminClearSession")}
                        </label>
                      )}
                    </Field>
                  </>
                )}
                <GenerationFields
                  id="br"
                  maxLabel={t("adminMaxTokens")}
                  tempHint={t("adminTemperatureHintBedrock")}
                  tempMax={GENERATION.temperature.bedrockMax}
                  maxTokens={form.bedrockMaxTokens}
                  temperature={form.bedrockTemperature}
                  timeout={form.bedrockTimeout}
                  instructions={form.bedrockInstructions}
                  onMaxTokens={(v) => set("bedrockMaxTokens", v)}
                  onTemperature={(v) => set("bedrockTemperature", v)}
                  onTimeout={(v) => set("bedrockTimeout", v)}
                  onInstructions={(v) => set("bedrockInstructions", v)}
                  invalid={{
                    maxTokens: bad("bedrockmaxTokens"),
                    temperature: bad("bedrocktemperature"),
                    timeout: bad("bedrocktimeoutSec"),
                    instructions: bad("bedrockextraInstructions"),
                  }}
                />
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
                <GenerationFields
                  id="az"
                  maxLabel={t("adminMaxCompletionTokens")}
                  tempHint={t("adminTemperatureHintAzure")}
                  tempMax={GENERATION.temperature.azureMax}
                  maxTokens={form.azureMaxTokens}
                  temperature={form.azureTemperature}
                  timeout={form.azureTimeout}
                  instructions={form.azureInstructions}
                  onMaxTokens={(v) => set("azureMaxTokens", v)}
                  onTemperature={(v) => set("azureTemperature", v)}
                  onTimeout={(v) => set("azureTimeout", v)}
                  onInstructions={(v) => set("azureInstructions", v)}
                  invalid={{
                    maxTokens: bad("azuremaxTokens"),
                    temperature: bad("azuretemperature"),
                    timeout: bad("azuretimeoutSec"),
                    instructions: bad("azureextraInstructions"),
                  }}
                />
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

            {dirty && (
              <p
                role="alert"
                className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm"
              >
                {t("adminDirty")}
              </p>
            )}

            {test && (
              <div
                role={test.ok ? "status" : "alert"}
                className={
                  "rounded-2xl border p-3 text-sm " +
                  (test.ok ? "border-bio/40 bg-bio/10" : "border-destructive/40 bg-destructive/10")
                }
              >
                {test.ok ? (
                  <div>
                    <p>
                      {t("adminTestOk")}{" "}
                      <span className="font-mono text-xs" dir="ltr">
                        {test.provider} · {test.ms} ms
                      </span>
                    </p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {t("adminTestTarget")}{" "}
                      <span className="font-mono" dir="ltr">
                        {test.target}
                      </span>
                    </p>
                  </div>
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
                    {test.target && (
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {t("adminTestTarget")}{" "}
                        <span className="font-mono" dir="ltr">
                          {test.target}
                        </span>
                      </p>
                    )}
                    {test.hint && <p className="mt-2 text-sm">{t(HINT_KEYS[test.hint])}</p>}
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

function RadioRow<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-bold">{legend}</legend>
      <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map(([id, label]) => (
          <label
            key={id}
            className={
              "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-semibold transition-colors " +
              (value === id ? "border-subject bg-subject/10" : "border-border hover:bg-accent/40")
            }
          >
            <input
              type="radio"
              name={name}
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="size-4 accent-[var(--subject)]"
            />
            <span dir="ltr">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GenerationFields({
  id,
  maxLabel,
  tempHint,
  tempMax,
  maxTokens,
  temperature,
  timeout,
  instructions,
  onMaxTokens,
  onTemperature,
  onTimeout,
  onInstructions,
  invalid,
}: {
  id: string;
  maxLabel: string;
  tempHint: string;
  tempMax: number;
  maxTokens: string;
  temperature: string;
  timeout: string;
  instructions: string;
  onMaxTokens: (v: string) => void;
  onTemperature: (v: string) => void;
  onTimeout: (v: string) => void;
  onInstructions: (v: string) => void;
  invalid: { maxTokens: boolean; temperature: boolean; timeout: boolean; instructions: boolean };
}) {
  const { t } = useLang();
  return (
    <>
      <h3 className="text-sm font-bold sm:col-span-2">{t("adminGeneration")}</h3>
      <Field
        id={`${id}-max`}
        label={maxLabel}
        hint={t("adminMaxTokensHint")}
        invalid={invalid.maxTokens}
      >
        <Input
          id={`${id}-max`}
          type="number"
          inputMode="numeric"
          dir="ltr"
          min={GENERATION.maxTokens.min}
          max={GENERATION.maxTokens.max}
          step={1}
          value={maxTokens}
          onChange={(e) => onMaxTokens(e.target.value)}
          aria-invalid={invalid.maxTokens}
        />
      </Field>
      <Field
        id={`${id}-temp`}
        label={t("adminTemperature")}
        hint={tempHint}
        invalid={invalid.temperature}
      >
        <Input
          id={`${id}-temp`}
          type="number"
          inputMode="decimal"
          dir="ltr"
          min={0}
          max={tempMax}
          step={0.1}
          value={temperature}
          onChange={(e) => onTemperature(e.target.value)}
          aria-invalid={invalid.temperature}
        />
      </Field>
      <Field
        id={`${id}-timeout`}
        label={t("adminTimeout")}
        hint={t("adminTimeoutHint")}
        invalid={invalid.timeout}
      >
        <Input
          id={`${id}-timeout`}
          type="number"
          inputMode="numeric"
          dir="ltr"
          min={GENERATION.timeoutSec.min}
          max={GENERATION.timeoutSec.max}
          step={1}
          value={timeout}
          onChange={(e) => onTimeout(e.target.value)}
          aria-invalid={invalid.timeout}
        />
      </Field>
      <Field
        id={`${id}-instr`}
        label={t("adminInstructions")}
        hint={t("adminInstructionsHint")}
        invalid={invalid.instructions}
        wide
      >
        <Textarea
          id={`${id}-instr`}
          rows={3}
          maxLength={GENERATION.instructionsMax}
          value={instructions}
          onChange={(e) => onInstructions(e.target.value)}
          aria-invalid={invalid.instructions}
        />
      </Field>
    </>
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

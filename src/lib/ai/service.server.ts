import {
  azureStored,
  bedrockStored,
  type AdminResult,
  type AiProvider,
  type AiTestResult,
  type AskTutorInput,
  type AskTutorResult,
  type AzureConfig,
  type BedrockConfig,
  type PublicAiSettings,
  type SaveSettingsInput,
} from "@/lib/ai-config";
import { decryptJson, encryptJson, isValidEncryptionKey } from "./crypto.server";
import { buildPrompts, callAzure, callBedrock, ProviderError } from "./providers.server";

/** AI tutor business logic. All I/O goes through `AiStore`, so it can be tested without Supabase. */

export interface AiSettingsRow {
  enabled: boolean;
  active_provider: AiProvider;
  bedrock_config: string | null;
  azure_config: string | null;
  updated_at: string | null;
}

export interface AiUsageRow {
  request_count: number;
  error_count: number;
  last_used_at: string | null;
  last_provider: string | null;
}

export interface AuthedUser {
  id: string;
  /** From app_metadata, which only the service role can write (user_metadata is user-editable). */
  role: string | null;
}

export interface AiStore {
  /** Validates the access token with Supabase Auth. Null for anything invalid / expired. */
  getUser(accessToken: string): Promise<AuthedUser | null>;
  loadSettings(): Promise<AiSettingsRow>;
  saveSettings(patch: Partial<Omit<AiSettingsRow, "updated_at">>, updatedBy: string): Promise<void>;
  loadUsage(): Promise<AiUsageRow>;
  recordUsage(provider: AiProvider, ok: boolean): Promise<void>;
}

export interface AiServiceDeps {
  store: AiStore;
  /** Base64 32-byte key. Null = encryption not configured on the server. */
  encryptionKey: string | null;
  /** Optional extra allow-list: when non-empty, an admin must also be one of these user ids. */
  adminIds?: string[];
  fetchImpl?: typeof fetch;
  now?: () => number;
  rateLimit?: { max: number; windowMs: number };
}

const CONTEXT = { bedrock: "ai_settings:bedrock", azure: "ai_settings:azure" } as const;

export function createAiService(deps: AiServiceDeps) {
  const { store, encryptionKey } = deps;
  const now = deps.now ?? Date.now;
  const limit = deps.rateLimit ?? { max: 30, windowMs: 10 * 60_000 };
  const hits = new Map<string, number[]>();

  const ready = isValidEncryptionKey(encryptionKey);

  /** Per-user sliding window. In-memory, so best-effort on multi-instance hosting. */
  function allow(userId: string) {
    const t = now();
    const recent = (hits.get(userId) ?? []).filter((x) => t - x < limit.windowMs);
    if (recent.length >= limit.max) {
      hits.set(userId, recent);
      return false;
    }
    recent.push(t);
    hits.set(userId, recent);
    if (hits.size > 5000)
      for (const [k, v] of hits) if (!v.some((x) => t - x < limit.windowMs)) hits.delete(k);
    return true;
  }

  async function readConfig<T>(
    row: AiSettingsRow,
    provider: AiProvider,
    schema: { safeParse(v: unknown): { success: true; data: T } | { success: false } },
  ): Promise<T | null> {
    const token = provider === "bedrock" ? row.bedrock_config : row.azure_config;
    if (!token || !ready || !encryptionKey) return null;
    const plain = await decryptJson(token, encryptionKey, CONTEXT[provider]);
    const parsed = schema.safeParse(plain);
    return parsed.success ? parsed.data : null;
  }

  async function requireAdmin(
    accessToken: string,
  ): Promise<{ user: AuthedUser } | { reason: "auth" | "forbidden" }> {
    const user = await store.getUser(accessToken).catch(() => null);
    if (!user) return { reason: "auth" };
    if (user.role !== "admin") return { reason: "forbidden" };
    if (deps.adminIds?.length && !deps.adminIds.includes(user.id)) return { reason: "forbidden" };
    return { user };
  }

  async function publicSettings(): Promise<PublicAiSettings> {
    const [row, usage] = await Promise.all([store.loadSettings(), store.loadUsage()]);
    const bedrock = await readConfig<BedrockConfig>(row, "bedrock", bedrockStored);
    const azure = await readConfig<AzureConfig>(row, "azure", azureStored);
    return {
      enabled: row.enabled,
      activeProvider: row.active_provider,
      bedrock: bedrock ? { region: bedrock.region, modelId: bedrock.modelId, hasKey: true } : null,
      azure: azure
        ? {
            endpoint: azure.endpoint,
            deployment: azure.deployment,
            apiVersion: azure.apiVersion,
            region: azure.region,
            hasKey: true,
          }
        : null,
      updatedAt: row.updated_at,
      usage: {
        requests: usage.request_count,
        errors: usage.error_count,
        lastUsedAt: usage.last_used_at,
        lastProvider: usage.last_provider,
      },
      serverReady: ready,
    };
  }

  return {
    /** Never throws: any failure becomes a reason the client answers locally. */
    async ask(input: AskTutorInput): Promise<AskTutorResult> {
      try {
        const user = await store.getUser(input.accessToken).catch(() => null);
        if (!user) return { ok: false, reason: "auth" };

        const row = await store.loadSettings();
        if (!row.enabled || !ready) return { ok: false, reason: "disabled" };

        const provider = row.active_provider;
        const config =
          provider === "bedrock"
            ? await readConfig<BedrockConfig>(row, "bedrock", bedrockStored)
            : await readConfig<AzureConfig>(row, "azure", azureStored);
        if (!config) return { ok: false, reason: "disabled" };

        if (!allow(user.id)) return { ok: false, reason: "rate" };

        const prompts = buildPrompts(input);
        try {
          const text =
            provider === "bedrock"
              ? await callBedrock(config as BedrockConfig, prompts, deps.fetchImpl)
              : await callAzure(config as AzureConfig, prompts, deps.fetchImpl);
          await store.recordUsage(provider, true).catch(() => {});
          return { ok: true, text };
        } catch (error) {
          const e = error instanceof ProviderError ? error : null;
          // `detail` is redacted and truncated; the key itself is never logged.
          console.error("AI tutor provider error", provider, e?.status ?? "-", e?.detail ?? "");
          await store.recordUsage(provider, false).catch(() => {});
          return { ok: false, reason: "error" };
        }
      } catch (error) {
        console.error("AI tutor failure", error instanceof Error ? error.name : "unknown");
        return { ok: false, reason: "error" };
      }
    },

    async adminGet(accessToken: string): Promise<AdminResult<PublicAiSettings>> {
      const gate = await requireAdmin(accessToken);
      if ("reason" in gate) return { ok: false, reason: gate.reason };
      try {
        return { ok: true, data: await publicSettings() };
      } catch {
        return { ok: false, reason: "error" };
      }
    },

    /** Runs one tiny request through the active provider and reports the real error to the admin. */
    async adminTest(accessToken: string): Promise<AdminResult<AiTestResult>> {
      const gate = await requireAdmin(accessToken);
      if ("reason" in gate) return { ok: false, reason: gate.reason };
      try {
        const row = await store.loadSettings();
        const provider = row.active_provider;
        const config =
          provider === "bedrock"
            ? await readConfig<BedrockConfig>(row, "bedrock", bedrockStored)
            : await readConfig<AzureConfig>(row, "azure", azureStored);
        if (!config) {
          return { ok: true, data: { ok: false, reason: "not_configured", provider } };
        }

        const prompts = { system: "Reply with the single word OK.", user: "ping" };
        const started = now();
        try {
          if (provider === "bedrock") {
            await callBedrock(config as BedrockConfig, prompts, deps.fetchImpl);
          } else {
            await callAzure(config as AzureConfig, prompts, deps.fetchImpl);
          }
          return { ok: true, data: { ok: true, provider, ms: now() - started } };
        } catch (error) {
          const e = error instanceof ProviderError ? error : null;
          return {
            ok: true,
            data: {
              ok: false,
              reason: "provider_error",
              provider,
              ...(e?.status !== undefined ? { status: e.status } : {}),
              ...(e?.detail ? { detail: e.detail } : {}),
            },
          };
        }
      } catch {
        return { ok: false, reason: "error" };
      }
    },
    async adminSave(input: SaveSettingsInput): Promise<AdminResult<PublicAiSettings>> {
      const gate = await requireAdmin(input.accessToken);
      if ("reason" in gate) return { ok: false, reason: gate.reason };
      if (!ready || !encryptionKey) return { ok: false, reason: "server_not_configured" };

      try {
        const row = await store.loadSettings();
        const patch: Parameters<AiStore["saveSettings"]>[0] = {};

        const nextBedrock = input.bedrock
          ? {
              ...input.bedrock,
              apiKey:
                input.bedrock.apiKey ??
                (await readConfig<BedrockConfig>(row, "bedrock", bedrockStored))?.apiKey,
            }
          : null;
        if (nextBedrock) {
          const parsed = bedrockStored.safeParse(nextBedrock);
          if (!parsed.success) return { ok: false, reason: "invalid", fields: ["bedrock.apiKey"] };
          patch.bedrock_config = await encryptJson(parsed.data, encryptionKey, CONTEXT.bedrock);
        }

        const nextAzure = input.azure
          ? {
              ...input.azure,
              apiKey:
                input.azure.apiKey ??
                (await readConfig<AzureConfig>(row, "azure", azureStored))?.apiKey,
            }
          : null;
        if (nextAzure) {
          const parsed = azureStored.safeParse(nextAzure);
          if (!parsed.success) return { ok: false, reason: "invalid", fields: ["azure.apiKey"] };
          patch.azure_config = await encryptJson(parsed.data, encryptionKey, CONTEXT.azure);
        }

        const provider = input.activeProvider ?? row.active_provider;
        const enabled = input.enabled ?? row.enabled;
        if (input.activeProvider) patch.active_provider = input.activeProvider;
        if (input.enabled !== undefined) patch.enabled = input.enabled;

        // Never switch the platform on (or onto a provider) without a complete config for it.
        const hasConfig =
          provider === "bedrock"
            ? Boolean(patch.bedrock_config ?? row.bedrock_config)
            : Boolean(patch.azure_config ?? row.azure_config);
        if (enabled && !hasConfig) {
          return { ok: false, reason: "invalid", fields: [`${provider}`] };
        }

        await store.saveSettings(patch, gate.user.id);
        return { ok: true, data: await publicSettings() };
      } catch {
        return { ok: false, reason: "error" };
      }
    },
  };
}

export type AiService = ReturnType<typeof createAiService>;

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AI_PROVIDERS, type AiProvider } from "@/lib/ai-config";
import {
  createAiService,
  type AiSettingsRow,
  type AiStore,
  type AiUsageRow,
} from "./service.server";

/**
 * Supabase-backed store using the service-role key. That key bypasses RLS, so it is read from the
 * server environment only (never VITE_*) and these tables have no policies for anon/authenticated.
 */

const env = (name: string) => process.env[name]?.trim() || undefined;

let cached: SupabaseClient | null | undefined;

function serviceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  cached =
    url && key
      ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
      : null;
  return cached;
}

const DEFAULT_ROW: AiSettingsRow = {
  enabled: false,
  active_provider: "bedrock",
  bedrock_config: null,
  azure_config: null,
  updated_at: null,
};

const DEFAULT_USAGE: AiUsageRow = {
  request_count: 0,
  error_count: 0,
  last_used_at: null,
  last_provider: null,
};

const isProvider = (v: unknown): v is AiProvider =>
  typeof v === "string" && (AI_PROVIDERS as readonly string[]).includes(v);

const asString = (v: unknown) => (typeof v === "string" ? v : null);

/** Store used when the service-role key is missing: every call is a safe "nothing configured". */
const unconfiguredStore: AiStore = {
  getUser: async () => null,
  loadProgress: async () => null,
  loadSettings: async () => DEFAULT_ROW,
  saveSettings: async () => {
    throw new Error("server not configured");
  },
  loadUsage: async () => DEFAULT_USAGE,
  recordUsage: async () => {},
};

function supabaseStore(client: SupabaseClient): AiStore {
  return {
    async getUser(accessToken) {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) return null;
      const role = data.user.app_metadata?.["role"];
      const name = data.user.user_metadata?.["display_name"];
      return {
        id: data.user.id,
        role: typeof role === "string" ? role : null,
        displayName: typeof name === "string" ? name : null,
        email: data.user.email ?? null,
      };
    },

    /** Only ever called with the id of the user the access token resolved to. */
    async loadProgress(userId) {
      const { data, error } = await client
        .from("user_progress")
        .select("state")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as { state?: unknown } | null)?.state ?? null;
    },

    async loadSettings() {
      const { data, error } = await client
        .from("ai_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_ROW;
      const row = data as Record<string, unknown>;
      return {
        enabled: row["enabled"] === true,
        active_provider: isProvider(row["active_provider"]) ? row["active_provider"] : "bedrock",
        bedrock_config: asString(row["bedrock_config"]),
        azure_config: asString(row["azure_config"]),
        updated_at: asString(row["updated_at"]),
      };
    },

    async saveSettings(patch, updatedBy) {
      const { error } = await client
        .from("ai_settings")
        .upsert({ id: 1, ...patch, updated_by: updatedBy, updated_at: new Date().toISOString() });
      if (error) throw error;
    },

    async loadUsage() {
      const { data, error } = await client.from("ai_usage").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_USAGE;
      const row = data as Record<string, unknown>;
      return {
        request_count: Number(row["request_count"]) || 0,
        error_count: Number(row["error_count"]) || 0,
        last_used_at: asString(row["last_used_at"]),
        last_provider: asString(row["last_provider"]),
      };
    },

    async recordUsage(provider, ok) {
      await client.rpc("ai_record_usage", { p_provider: provider, p_ok: ok });
    },
  };
}

let service: ReturnType<typeof createAiService> | undefined;

/** One service instance per server process (keeps the rate-limit window in memory). */
export function getAiService() {
  if (!service) {
    const client = serviceClient();
    service = createAiService({
      store: client ? supabaseStore(client) : unconfiguredStore,
      encryptionKey: env("AI_SETTINGS_ENCRYPTION_KEY") ?? null,
      adminIds: (env("ADMIN_USER_IDS") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }
  return service;
}

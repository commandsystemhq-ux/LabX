import { z } from "zod";

/**
 * Shared (client + server) shapes and validation for the AI tutor. Contains no secrets and no I/O.
 * Every value an admin saves or a student sends passes through these schemas on the server.
 */

export const AI_PROVIDERS = ["bedrock", "azure"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const DEFAULT_AZURE_API_VERSION = "2024-10-21";
export const MAX_QUESTION = 300;

const REGION_RE = /^[a-z]{2}(?:-[a-z]+)+-\d{1,2}$/;
const BEDROCK_MODEL_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,199}$/;
const AZURE_DEPLOYMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const AZURE_VERSION_RE = /^\d{4}-\d{2}-\d{2}(?:-preview)?$/;
const AZURE_HOST_RE = /^[a-z0-9][a-z0-9-]{0,62}\.(?:openai|cognitiveservices)\.azure\.com$/;

/**
 * Azure resource endpoints only: https, no credentials, no custom port, and an Azure hostname.
 * Anything else is rejected so an admin typo (or a stolen admin session) can't aim the server at
 * an internal address. Returns the normalised origin, or null.
 */
export function normalizeAzureEndpoint(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    if (!AZURE_HOST_RE.test(u.hostname)) return null;
    return `https://${u.hostname}`;
  } catch {
    return null;
  }
}

/** Visible ASCII without spaces: API keys never contain anything else. */
const secret = z
  .string()
  .trim()
  .min(8)
  .max(512)
  .regex(/^[\x21-\x7e]+$/);

const region = z.string().trim().regex(REGION_RE).max(30);

/** What the admin form sends for Bedrock. `apiKey` omitted = keep the stored key. */
export const bedrockInput = z.object({
  region,
  modelId: z.string().trim().regex(BEDROCK_MODEL_RE),
  apiKey: secret.optional(),
});

/** What the admin form sends for Azure OpenAI. `apiKey` omitted = keep the stored key. */
export const azureInput = z.object({
  endpoint: z
    .string()
    .max(200)
    .transform((v, ctx) => {
      const origin = normalizeAzureEndpoint(v);
      if (!origin) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid endpoint" });
      return origin ?? "";
    }),
  deployment: z.string().trim().regex(AZURE_DEPLOYMENT_RE),
  apiVersion: z.string().trim().regex(AZURE_VERSION_RE).default(DEFAULT_AZURE_API_VERSION),
  region: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9-]*$/)
    .default(""),
  apiKey: secret.optional(),
});

/** The decrypted shapes stored in Supabase (key always present). */
export const bedrockStored = bedrockInput.extend({ apiKey: secret });
export const azureStored = azureInput.extend({ apiKey: secret });
export type BedrockConfig = z.infer<typeof bedrockStored>;
export type AzureConfig = z.infer<typeof azureStored>;

const accessToken = z.string().min(20).max(4096);

export const adminAccessInput = z.object({ accessToken });

export const saveSettingsInput = z.object({
  accessToken,
  enabled: z.boolean().optional(),
  activeProvider: z.enum(AI_PROVIDERS).optional(),
  bedrock: bedrockInput.optional(),
  azure: azureInput.optional(),
});
export type SaveSettingsInput = z.infer<typeof saveSettingsInput>;

export const TUTOR_INTENTS = [
  "colloquial",
  "why",
  "example",
  "mistake",
  "free",
  "hint",
  "hazard",
  "general",
] as const;

export const NOOR_PAGES = ["home", "dashboard", "lesson", "auth", "admin", "other"] as const;
export type NoorPageId = (typeof NOOR_PAGES)[number];

/**
 * What Noor knows about where the student is. Built by the client from local data and treated as
 * untrusted text by the server. Lesson-only fields are absent outside a lesson.
 */
export const askTutorInput = z.object({
  accessToken,
  question: z.string().trim().min(1).max(MAX_QUESTION),
  intent: z.enum(TUTOR_INTENTS),
  lang: z.enum(["ar", "en"]),
  page: z.enum(NOOR_PAGES),
  grade: z.enum(["g10", "g11", "g12"]).optional(),
  subject: z.enum(["biology", "physics", "chemistry"]).optional(),
  simId: z.enum(["ohm", "reaction-rate", "diffusion"]).optional(),
  step: z.number().int().min(1).max(4).optional(),
  mode: z.enum(["guided", "free"]).optional(),
  view: z.enum(["macro", "molecular"]).optional(),
  scene: z.string().max(600),
  hazards: z.array(z.string().max(240)).max(3),
  errorMode: z.boolean(),
  task: z.string().max(300).optional(),
});
export type AskTutorInput = z.infer<typeof askTutorInput>;
export type AskTutorResult =
  { ok: true; text: string } | { ok: false; reason: "disabled" | "auth" | "rate" | "error" };

/** What the admin page may see: never any key, only whether one is stored. */
export interface PublicAiSettings {
  enabled: boolean;
  activeProvider: AiProvider;
  bedrock: { region: string; modelId: string; hasKey: boolean } | null;
  azure: {
    endpoint: string;
    deployment: string;
    apiVersion: string;
    region: string;
    hasKey: boolean;
  } | null;
  updatedAt: string | null;
  usage: {
    requests: number;
    errors: number;
    lastUsedAt: string | null;
    lastProvider: string | null;
  };
  /** False when the server is missing its encryption key, so nothing can be saved yet. */
  serverReady: boolean;
}

/** Result of the admin's Test connection button: the real provider error, for the admin only. */
export type AiTestResult =
  | { ok: true; provider: AiProvider; ms: number }
  | {
      ok: false;
      reason: "not_configured" | "provider_error";
      provider: AiProvider;
      status?: number;
      detail?: string;
    };

export type AdminResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: "auth" | "forbidden" | "invalid" | "server_not_configured" | "error";
      fields?: string[];
    };

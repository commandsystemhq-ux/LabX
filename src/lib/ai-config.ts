import { z } from "zod";

/**
 * Shared (client + server) shapes and validation for the AI tutor. Contains no secrets and no I/O.
 * Every value an admin saves or a student sends passes through these schemas on the server.
 */

export const AI_PROVIDERS = ["bedrock", "azure"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const DEFAULT_AZURE_API_VERSION = "2024-10-21";
export const MAX_QUESTION = 300;
/** Conversation memory sent with a question: latest turns verbatim + a digest of older ones. */
export const MAX_HISTORY_TURNS = 8;
export const MAX_TURN_CHARS = 600;
export const MAX_SUMMARY_CHARS = 1000;

const REGION_RE = /^[a-z]{2}(?:-[a-z]+)+-\d{1,2}$/;
const BEDROCK_MODEL_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,199}$/;
/** Bedrock ARNs (inference / application profiles, foundation models); the account id may be empty. */
const BEDROCK_ARN_RE =
  /^arn:aws(?:-[a-z]+)*:bedrock:[a-z]{2}(?:-[a-z]+)+-\d{1,2}:\d{0,12}:(?:inference-profile|application-inference-profile|foundation-model|provisioned-model|imported-model|custom-model)\/[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const AZURE_DEPLOYMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const AZURE_VERSION_RE = /^\d{4}-\d{2}-\d{2}(?:-preview)?$/;
const AZURE_HOST_RE = /^[a-z0-9][a-z0-9-]{0,62}\.(?:openai|cognitiveservices)\.azure\.com$/;

export const BEDROCK_AUTH_MODES = ["apikey", "iam"] as const;
export type BedrockAuthMode = (typeof BEDROCK_AUTH_MODES)[number];
export const BEDROCK_API_MODES = ["converse", "invoke"] as const;
export type BedrockApiMode = (typeof BEDROCK_API_MODES)[number];

/** Generation limits shared by the admin form, the server schemas and the provider calls. */
export const GENERATION = {
  maxTokens: { min: 16, max: 4096, def: 450 },
  timeoutSec: { min: 3, max: 60, def: 20 },
  temperature: { def: 0.4, bedrockMax: 1, azureMax: 2 },
  instructionsMax: 1000,
} as const;

/**
 * Azure resource endpoints only: https, no credentials, no custom port, and an Azure hostname.
 * Anything else is rejected so an admin typo (or a stolen admin session) can't aim the server at
 * an internal address. A missing scheme is tolerated; any path or trailing `/` is dropped.
 * Returns the normalised origin, or null.
 */
export function normalizeAzureEndpoint(raw: string): string | null {
  try {
    const text = raw.trim();
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
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

/** Pasted credentials often carry spaces, line breaks or a "Bearer " prefix: drop them first. */
const stripSpaces = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, "") : v);
const cleanBearer = (v: unknown) =>
  typeof v === "string"
    ? v
        .trim()
        .replace(/^bearer\s+/i, "")
        .replace(/\s+/g, "")
    : v;

/** An IAM access key id (AKIA… / ASIA…) pasted where a Bedrock API key belongs is a common mistake. */
const IAM_KEY_ID_RE = /^(?:AKIA|ASIA|AIDA|AROA)[A-Z0-9]{12,}$/;
export const IAM_KEY_IN_API_KEY = "iam_key_in_api_key";

const bearerKey = z.preprocess(
  cleanBearer,
  z
    .string()
    .min(8)
    .max(4096)
    .regex(/^[\x21-\x7e]+$/)
    .refine((v) => !(v.length <= 24 && IAM_KEY_ID_RE.test(v)), { message: IAM_KEY_IN_API_KEY }),
);
const accessKeyId = z.preprocess(stripSpaces, z.string().regex(/^[A-Z0-9]{16,128}$/));
const secretAccessKey = z.preprocess(stripSpaces, z.string().regex(/^[A-Za-z0-9/+=]{30,128}$/));
const sessionToken = z.preprocess(
  stripSpaces,
  z
    .string()
    .min(16)
    .max(4096)
    .regex(/^[\x21-\x7e]+$/),
);

const region = z.string().trim().regex(REGION_RE).max(30);

const bedrockModelId = z
  .string()
  .trim()
  .refine((v) => BEDROCK_MODEL_RE.test(v) || (v.length <= 300 && BEDROCK_ARN_RE.test(v)));

/** Generation settings stored (encrypted) with each provider; omitted = the defaults above. */
const generation = (maxTemperature: number) => ({
  maxTokens: z
    .number()
    .int()
    .min(GENERATION.maxTokens.min)
    .max(GENERATION.maxTokens.max)
    .optional(),
  temperature: z.number().min(0).max(maxTemperature).optional(),
  timeoutSec: z
    .number()
    .int()
    .min(GENERATION.timeoutSec.min)
    .max(GENERATION.timeoutSec.max)
    .optional(),
  extraInstructions: z.string().trim().max(GENERATION.instructionsMax).optional(),
});

const bedrockBase = z.object({
  region,
  modelId: bedrockModelId,
  authMode: z.enum(BEDROCK_AUTH_MODES).optional(),
  apiMode: z.enum(BEDROCK_API_MODES).optional(),
  apiKey: bearerKey.optional(),
  accessKeyId: accessKeyId.optional(),
  secretAccessKey: secretAccessKey.optional(),
  sessionToken: sessionToken.optional(),
  ...generation(GENERATION.temperature.bedrockMax),
});

/**
 * What the admin form sends for Bedrock. Every secret omitted = keep the stored one; only the
 * secrets of the chosen `authMode` (default `apikey`) are kept.
 */
export const bedrockInput = bedrockBase.extend({ clearSessionToken: z.boolean().optional() });

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
  apiKey: z.preprocess(stripSpaces, secret).optional(),
  ...generation(GENERATION.temperature.azureMax),
});

/** The decrypted shapes stored in Supabase (the credentials of the chosen mode always present). */
export const bedrockStored = bedrockBase.superRefine((c, ctx) => {
  const missing =
    (c.authMode ?? "apikey") === "iam"
      ? [!c.accessKeyId && "accessKeyId", !c.secretAccessKey && "secretAccessKey"]
      : [!c.apiKey && "apiKey"];
  for (const field of missing) {
    if (field) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "required" });
  }
});
export const azureStored = azureInput.extend({ apiKey: z.preprocess(stripSpaces, secret) });
export type BedrockConfig = z.infer<typeof bedrockStored>;
export type AzureConfig = z.infer<typeof azureStored>;

/** Soft warning for a Model ID that can't work in the chosen region (inference-profile prefix / ARN region). */
export function bedrockModelWarning(regionValue: string, modelId: string): boolean {
  const id = modelId.trim();
  const reg = regionValue.trim();
  if (!reg || !id) return false;
  if (id.startsWith("arn:")) return (id.split(":")[3] ?? reg) !== reg;
  const geo = /^(us-gov|us|eu|apac)\./.exec(id)?.[1];
  if (!geo) return false;
  const prefix = reg.startsWith("us-gov-") ? "us-gov" : (reg.split("-")[0] ?? "");
  return geo !== (prefix === "ap" ? "apac" : prefix);
}

/** Admin-facing explanation codes for common provider failures (mapped to bilingual text in the UI). */
export const AI_ERROR_HINTS = [
  "inference_profile",
  "model_access",
  "model_invalid",
  "bad_credentials",
  "bad_signature",
  "deployment_not_found",
  "bad_key",
  "timeout",
] as const;
export type AiErrorHint = (typeof AI_ERROR_HINTS)[number];

const accessToken = z.string().min(20).max(4096);

export const adminAccessInput = z.object({ accessToken });

export const adminTestInput = z.object({
  accessToken,
  /** Which provider's saved settings to test; defaults to the saved active one. */
  provider: z.enum(AI_PROVIDERS).optional(),
});

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
  history: z
    .array(z.object({ role: z.enum(["student", "noor"]), text: z.string().max(MAX_TURN_CHARS) }))
    .max(MAX_HISTORY_TURNS)
    .optional(),
  summary: z.string().max(MAX_SUMMARY_CHARS).optional(),
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

/** Generation settings as shown to the admin (defaults filled in). */
export interface PublicGeneration {
  maxTokens: number;
  /** Null = not sent to the provider (model default). */
  temperature: number | null;
  timeoutSec: number;
  extraInstructions: string;
}

/** What the admin page may see: never any key, only whether one is stored. */
export interface PublicAiSettings {
  enabled: boolean;
  activeProvider: AiProvider;
  bedrock:
    | ({
        region: string;
        modelId: string;
        authMode: BedrockAuthMode;
        apiMode: BedrockApiMode;
        /** The credentials required by `authMode` are all stored. */
        hasKey: boolean;
        hasSessionToken: boolean;
      } & PublicGeneration)
    | null;
  azure:
    | ({
        endpoint: string;
        deployment: string;
        apiVersion: string;
        region: string;
        hasKey: boolean;
      } & PublicGeneration)
    | null;
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
  | {
      ok: true;
      provider: AiProvider;
      ms: number;
      /** Non-secret description of what was tested (model / deployment + auth method). */
      target: string;
    }
  | {
      ok: false;
      reason: "not_configured" | "provider_error";
      provider: AiProvider;
      status?: number;
      detail?: string;
      hint?: AiErrorHint;
      target?: string;
    };

export type AdminResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: "auth" | "forbidden" | "invalid" | "server_not_configured" | "error";
      fields?: string[];
    };

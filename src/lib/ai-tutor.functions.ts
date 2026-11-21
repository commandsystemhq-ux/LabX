import { createServerFn } from "@tanstack/react-start";
import {
  adminAccessInput,
  adminTestInput,
  askTutorInput,
  saveSettingsInput,
  studioInput,
} from "./ai-config";

/**
 * Server functions are the only door to the AI provider and its settings. The `*.server.ts`
 * modules are imported inside the handlers so they (and every secret) never reach the client bundle.
 */

export const askAiTutorFn = createServerFn({ method: "POST" })
  .validator(askTutorInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().ask(data);
  });

/** Noor Studio: build or edit a custom mind map / flashcard pack. Signed-in students only (checked in the service). */
export const generateNoorStudioFn = createServerFn({ method: "POST" })
  .validator(studioInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().generateStudio(data);
  });

export const adminGetAiSettingsFn = createServerFn({ method: "POST" })
  .validator(adminAccessInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().adminGet(data.accessToken);
  });

export const adminSaveAiSettingsFn = createServerFn({ method: "POST" })
  .validator(saveSettingsInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().adminSave(data);
  });

export const adminTestAiFn = createServerFn({ method: "POST" })
  .validator(adminTestInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().adminTest(data.accessToken, data.provider);
  });

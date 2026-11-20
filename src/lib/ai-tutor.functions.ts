import { createServerFn } from "@tanstack/react-start";
import { adminAccessInput, askTutorInput, saveSettingsInput } from "./ai-config";

/**
 * Server functions are the only door to the AI provider and its settings. The `*.server.ts`
 * modules are imported inside the handlers so they (and every secret) never reach the client bundle.
 */

export const askAiTutorFn = createServerFn({ method: "POST" })
  .inputValidator(askTutorInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().ask(data);
  });

export const adminGetAiSettingsFn = createServerFn({ method: "POST" })
  .inputValidator(adminAccessInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().adminGet(data.accessToken);
  });

export const adminSaveAiSettingsFn = createServerFn({ method: "POST" })
  .inputValidator(saveSettingsInput)
  .handler(async ({ data }) => {
    const { getAiService } = await import("./ai/store.server");
    return getAiService().adminSave(data);
  });

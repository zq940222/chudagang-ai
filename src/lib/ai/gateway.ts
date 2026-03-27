import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE PROTOCOL ADAPTER:
 * Uses .chat() to force the legacy Chat Completion protocol
 * that Azure OpenAI deployments support (instead of the Responses API).
 */
const azureCompatibleProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;

    console.log(`DEBUG: Protocol Adapter -> Redirecting to: ${finalUrl}`);

    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);
    headers.delete("Authorization");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};
    try {
      body = JSON.parse(options?.body as string);
      // Remove model field — Azure infers it from the deployment URL
      delete body.model;
    } catch (e) {
      console.error("DEBUG: Body parsing error", e);
    }

    return fetch(finalUrl, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Use .chat() to force legacy Chat Completion protocol instead of Responses API
    return azureCompatibleProvider.chat("gpt-4o");
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

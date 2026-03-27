import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE COMPATIBILITY BRIDGE:
 * We use the OpenAI provider to ensure the SDK uses the classic Chat Completions protocol.
 * We use 'gpt-3.5-turbo' as a model alias to prevent the SDK from upgrading to the new Inference protocol.
 * The fetch interceptor handles the Azure-specific URL, Versioning, and Authentication.
 */
const azureCompatibleProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    // Manually build the EXACT URL that we verified with the raw fetch script
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    console.log(`DEBUG: Protocol Bridge -> Redirecting to Azure: ${finalUrl}`);
    
    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);
    headers.delete("Authorization"); // Azure rejects standard OpenAI Bearer tokens

    return fetch(finalUrl, {
      ...options,
      headers,
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // 'gpt-3.5-turbo' is the "Safest" model name. 
    // It forces the SDK to expect the legacy 'choices' response format,
    // which matches what Azure is currently sending back.
    return azureCompatibleProvider("gpt-3.5-turbo");
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

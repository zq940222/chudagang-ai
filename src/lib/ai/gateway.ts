import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * FINAL STRATEGY:
 * We use the OpenAI compatible provider but with a manually constructed baseURL
 * that includes the full Azure deployment path. To prevent the SDK from appending
 * anything else, we use a custom fetch that effectively Ignores the URL the SDK 
 * thinks it's calling and uses our verified one.
 */
const azureProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (inputUrl, options) => {
    // This is the ONLY URL we know works for your Azure resource.
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    console.log(`DEBUG: Intercepting AI SDK call. Redirecting to verified Azure path: ${finalUrl}`);
    
    // Ensure Azure auth header is present
    const headers = new Headers(options.headers);
    headers.set("api-key", azureApiKey);

    return fetch(finalUrl, {
      ...options,
      headers,
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // We pass a generic model name. The actual URL is handled by our interceptor.
    return azureProvider("gpt-4o"); 
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

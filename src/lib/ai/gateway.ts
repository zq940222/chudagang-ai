import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

// Azure configurations
const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * STRATEGY: Custom Fetch Wrapper
 * We provide a custom fetch implementation to the OpenAI provider.
 * No matter what URL the SDK tries to build internally (e.g., .../responses),
 * we intercept it and redirect it to the EXACT Azure Chat Completions endpoint
 * that we verified working with our local script.
 */
const azure = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    const correctUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    // Inject Azure-specific headers
    const headers = new Headers(options.headers);
    headers.set("api-key", azureApiKey);

    console.log(`DEBUG: Intercepting SDK request. Redirecting to Azure: ${correctUrl}`);
    
    return fetch(correctUrl, {
      ...options,
      headers,
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // We use a standard model name to keep the SDK happy internally.
    // The actual URL and model used are controlled by our custom fetch wrapper above.
    return azure("gpt-4");
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

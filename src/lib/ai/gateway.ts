import { openai } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE ULTIMATE AZURE ADAPTER:
 * We use the official Azure provider so that the SDK expects Azure-formatted responses.
 * We use a fetch interceptor ONLY to fix the URL path and version,
 * bypassing the SDK's internal misidentification of the 'gpt-5.4' model.
 */
const azure = createAzure({
  resourceName: azureResourceName,
  apiKey: azureApiKey,
  apiVersion: azureApiVersion,
  fetch: async (url, options) => {
    // 1. Force the correct path: always use /chat/completions for this deployment
    let finalUrl = url.toString()
      .replace(/\/responses($|\?)/, "/chat/completions$1")
      .replace(/api-version=[^&]+/, `api-version=${azureApiVersion}`);

    console.log(`DEBUG: Azure Adapter Redirect: ${finalUrl}`);

    // 2. Ensure the API key is present in headers (Azure requirement)
    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);

    return fetch(finalUrl, {
      ...options,
      headers,
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Calling the azure provider directly. The interceptor handles the rest.
    return azure(azureDeploymentName);
  }

  const openaiDefault = openai(process.env.OPENAI_MODEL_NAME || "gpt-4o-mini");
  return openaiDefault;
}

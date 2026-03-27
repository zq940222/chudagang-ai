import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

// Azure configurations
const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

// We use the OpenAI provider but point it to Azure's specific deployment URL.
// This is more robust as it guarantees the use of the /chat/completions endpoint.
const azure = createOpenAI({
  baseURL: `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}`,
  apiKey: azureApiKey,
  headers: {
    "api-key": azureApiKey,
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Standard OpenAI provider instance call with empty model name
    // since deployment is in baseURL. We cast to any to allow queryParams
    // which is the common way to handle api-version in compatible providers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (azure as any)("", {
      queryParams: { "api-version": azureApiVersion },
    });
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

// Azure configurations
const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

// We use the OpenAI provider but point it to Azure's specific deployment URL.
// We point the baseURL to the deployment path.
// The OpenAI provider will append '/chat/completions' to this URL.
const azure = createOpenAI({
  baseURL: `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}`,
  apiKey: azureApiKey,
  headers: {
    "api-key": azureApiKey,
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // We use a dummy model name because the deployment is already in the baseURL.
    // We MUST NOT use an empty string as it triggers the 'Inference' API (/responses).
    // By using 'chat', the SDK appends '/chat/completions' which is correct.
    // However, Azure ignores the 'model' field in the JSON body when using deployment URLs,
    // so this is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (azure as any)("chat", {
      queryParams: { "api-version": azureApiVersion },
    });
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

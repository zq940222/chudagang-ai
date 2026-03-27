import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

// Azure configurations
const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

// We use the OpenAI provider but point it to Azure's specific deployment URL.
const azure = createOpenAI({
  baseURL: `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}`,
  apiKey: azureApiKey,
  headers: {
    "api-key": azureApiKey,
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // STRATEGY: We use "gpt-4" as the model name here.
    // 1. This forces the Vercel AI SDK to use the "/chat/completions" path.
    // 2. Azure will receive the request at the correct URL.
    // 3. Azure COMPLETELY IGNORES the "model" field in the JSON body when using 
    //    deployment-based URLs, so it will correctly use your "gpt-5.4" deployment.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (azure as any)("gpt-4", {
      queryParams: { "api-version": azureApiVersion },
    });
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

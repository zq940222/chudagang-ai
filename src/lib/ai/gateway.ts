import { openai } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

// Azure configurations with robust fallbacks
const azureResourceName = process.env.AZURE_RESOURCE_NAME || "";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-08-01-preview";

console.log(`DEBUG: Initializing Azure AI with Resource: ${azureResourceName}, Version: ${azureApiVersion}`);

const azure = createAzure({
  resourceName: azureResourceName,
  apiKey: azureApiKey,
  apiVersion: azureApiVersion,
});

export function getModel(provider: ModelProvider = "openai") {
  const modelId = provider === "azure" 
    ? (process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o")
    : (process.env.OPENAI_MODEL_NAME || "gpt-4o-mini");

  console.log(`DEBUG: Getting model for provider: ${provider}, modelId: ${modelId}`);

  switch (provider) {
    case "azure":
      return azure(modelId);
    case "openai":
      return openai(modelId);
    case "claude":
      return openai("gpt-4o-mini");
    case "qwen":
      return openai("gpt-4o-mini");
    default:
      return openai("gpt-4o-mini");
  }
}

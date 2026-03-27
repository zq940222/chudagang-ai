import { openai } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

// Robust Azure configuration
const azure = createAzure({
  resourceName: azureResourceName,
  apiKey: azureApiKey,
  apiVersion: azureApiVersion,
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Standard Azure provider call
    return azure(azureDeploymentName);
  }

  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openai(openaiModel);
}

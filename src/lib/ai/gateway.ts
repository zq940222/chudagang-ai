import { openai } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
  apiVersion: process.env.AZURE_API_VERSION || "2024-05-01-preview",
});

export function getModel(provider: ModelProvider = "openai") {
  switch (provider) {
    case "azure":
      return azure(process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o");
    case "openai":
      return openai(process.env.OPENAI_MODEL_NAME || "gpt-4o-mini");
    case "claude":
      // Stub for now, using openai mini as fallback
      return openai("gpt-4o-mini");
    case "qwen":
      // Stub for now, using openai mini as fallback
      return openai("gpt-4o-mini");
    default:
      return openai("gpt-4o-mini");
  }
}

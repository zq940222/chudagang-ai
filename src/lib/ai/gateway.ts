import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE ULTIMATE FIX:
 * We intercept the SDK's fetch call to:
 * 1. Force the correct Azure URL path.
 * 2. Force the correct Azure Auth headers.
 * 3. FIX THE BODY: The SDK might send 'input' (Inference API), 
 *    but Azure Chat Completions expects 'messages'.
 */
const azureProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);

    // Parse the body sent by the SDK
    let body: any = {};
    try {
      body = JSON.parse(options?.body as string);
      
      // CRITICAL: If the SDK used the new Inference API format ('input'),
      // we convert it back to the standard Chat Completion format ('messages').
      if (body.input && !body.messages) {
        console.log("DEBUG: Converting SDK 'input' format to Azure 'messages' format.");
        body.messages = body.input;
        delete body.input;
      }
      
      // Azure deployment endpoints ignore the 'model' field, but let's keep it safe.
      if (body.model) delete body.model;
    } catch (e) {
      console.error("DEBUG: Failed to parse request body", e);
    }

    console.log(`DEBUG: Redirecting to verified Azure path: ${finalUrl}`);
    
    return fetch(finalUrl, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // We use a model name that is likely to trigger tools support in the SDK
    return azureProvider("gpt-4o"); 
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

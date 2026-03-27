import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE DEEP PROTOCOL FIX:
 * Azure Chat Completions is strict about the older schema.
 * We must recursively fix the body parts.
 */
const azureProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);

    let body: any = {};
    try {
      body = JSON.parse(options?.body as string);
      
      // 1. Convert 'input' to 'messages'
      if (body.input && !body.messages) {
        body.messages = body.input;
        delete body.input;
      }
      
      // 2. Deep fix message content types
      if (Array.isArray(body.messages)) {
        body.messages = body.messages.map((msg: any) => {
          if (Array.isArray(msg.content)) {
            msg.content = msg.content.map((part: any) => {
              // Map 'input_text' -> 'text' (Crucial for Azure compatibility)
              if (part.type === "input_text") {
                return { ...part, type: "text" };
              }
              return part;
            });
          }
          return msg;
        });
      }
      
      // Remove fields Azure might reject
      if (body.model) delete body.model;
      if (body.parallel_tool_calls === undefined) delete body.parallel_tool_calls;
      
    } catch (e) {
      console.error("DEBUG: Failed to parse/fix request body", e);
    }

    console.log(`DEBUG: Final path redirect: ${finalUrl}`);
    
    return fetch(finalUrl, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // We use a model name that doesn't trigger the newest SDK features 
    // to minimize protocol friction, but our interceptor handles the rest.
    return azureProvider("gpt-4"); 
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

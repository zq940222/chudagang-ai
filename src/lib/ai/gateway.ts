import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE PROTOCOL TRANSLATOR:
 * Translates Vercel AI SDK's modern "Inference API" protocol
 * back to the classic "Chat Completions" protocol that Azure expects.
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
      
      // 1. Fix Messages: Convert 'input' to 'messages' and 'input_text' to 'text'
      if (body.input && !body.messages) {
        body.messages = body.input;
        delete body.input;
      }
      
      if (Array.isArray(body.messages)) {
        body.messages = body.messages.map((msg: any) => {
          if (Array.isArray(msg.content)) {
            msg.content = msg.content.map((part: any) => {
              if (part.type === "input_text") return { ...part, type: "text" };
              return part;
            });
          }
          return msg;
        });
      }
      
      // 2. Fix Tools: Un-flatten tools for Azure/Classic OpenAI
      if (Array.isArray(body.tools)) {
        body.tools = body.tools.map((t: any) => {
          if (t.type === "function" && !t.function) {
            const { name, description, parameters, ...rest } = t;
            return {
              ...rest,
              type: "function",
              function: { name, description, parameters }
            };
          }
          return t;
        });
      }
      
      // 3. Cleanup: Remove fields that cause Azure to reject the request
      if (body.model) delete body.model;
      if (body.parallel_tool_calls === undefined) delete body.parallel_tool_calls;
      
    } catch (e) {
      console.error("DEBUG: Protocol translation failed", e);
    }

    console.log(`DEBUG: Protocol translated. Redirecting to: ${finalUrl}`);
    
    return fetch(finalUrl, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Using gpt-4 name to minimize protocol friction in the SDK
    return azureProvider("gpt-4"); 
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

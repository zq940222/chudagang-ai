import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "azure" | "claude" | "qwen";

const azureResourceName = process.env.AZURE_RESOURCE_NAME || "crewplus-eastus2";
const azureApiKey = process.env.AZURE_API_KEY || "";
const azureApiVersion = process.env.AZURE_API_VERSION || "2024-10-21";
const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-5.4";

/**
 * THE PROTOCOL ADAPTER:
 * Manually translates Vercel AI SDK's modern "Inference" request body
 * to the legacy "Chat Completion" format required by current Azure OpenAI deployments.
 */
const azureCompatibleProvider = createOpenAI({
  apiKey: azureApiKey,
  fetch: async (url, options) => {
    const finalUrl = `https://${azureResourceName}.openai.azure.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;
    
    console.log(`DEBUG: Protocol Adapter -> Rewriting Body & Redirecting to: ${finalUrl}`);
    
    const headers = new Headers(options?.headers);
    headers.set("api-key", azureApiKey);
    headers.delete("Authorization");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};
    try {
      body = JSON.parse(options?.body as string);
      
      // 1. Transform 'input' format back to 'messages' format
      if (body.input && !body.messages) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body.messages = body.input.map((msg: any) => {
          // Deep fix: Convert content parts if necessary
          if (Array.isArray(msg.content)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            msg.content = msg.content.map((part: any) => {
              // Convert 'input_text' back to standard 'text' type
              if (part.type === "input_text") return { ...part, type: "text" };
              return part;
            });
          }
          return msg;
        });
        delete body.input;
      }

      // 2. Transform tools format if necessary (handle SDK v6 flattening)
      if (Array.isArray(body.tools)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body.tools = body.tools.map((tool: any) => {
          if (tool.type === "function" && !tool.function) {
            const { name, description, parameters, ...rest } = tool;
            return { ...rest, type: "function", function: { name, description, parameters } };
          }
          return tool;
        });
      }

      // 3. Remove modern fields that Azure might reject
      delete body.model; 
      if (body.parallel_tool_calls === undefined) delete body.parallel_tool_calls;

    } catch (e) {
      console.error("DEBUG: Body parsing error", e);
    }

    return fetch(finalUrl, {
      ...options,
      headers,
      body: JSON.stringify(body),
    });
  },
});

export function getModel(provider: ModelProvider = "openai") {
  if (provider === "azure") {
    // Standard model alias to keep SDK happy
    return azureCompatibleProvider("gpt-4o");
  }

  const openaiDefault = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openaiModel = process.env.OPENAI_MODEL_NAME || "gpt-4o-mini";
  return openaiDefault(openaiModel);
}

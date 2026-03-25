import { openai } from "@ai-sdk/openai";

export type ModelProvider = "openai" | "claude" | "qwen";

const models: Record<ModelProvider, () => ReturnType<typeof openai>> = {
  openai: () => openai("gpt-4o-mini"),
  claude: () => openai("gpt-4o-mini"),
  qwen: () => openai("gpt-4o-mini"),
};

export function getModel(provider: ModelProvider = "openai") {
  return (models[provider] ?? models.openai)();
}

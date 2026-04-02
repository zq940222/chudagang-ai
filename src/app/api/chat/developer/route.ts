import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { auth } from "@/auth";
import { getModel } from "@/lib/ai/gateway";
import type { ModelProvider } from "@/lib/ai/gateway";
import { developerTools } from "@/lib/ai/developer-tools";
import { getDeveloperPrompt } from "@/lib/ai/developer-prompt";
import type { DeveloperOnboardingPhase, PromptLocale } from "@/lib/ai/developer-prompt";

// Track phase in memory per session (stateless per request, driven by tool usage)
function detectPhase(messages: UIMessage[]): DeveloperOnboardingPhase {
  const allText = JSON.stringify(messages);
  if (allText.includes("createDeveloperProfile")) return "DONE";
  if (allText.includes("extractDeveloperProfile")) return "REVIEW";
  return "COLLECT";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: rawMessages } = (await req.json()) as {
    messages: UIMessage[];
  };

  const phase = detectPhase(rawMessages);
  const locale = (session.user.locale as PromptLocale) || "zh";
  const systemPrompt = getDeveloperPrompt(phase, locale) +
    `\n\nIMPORTANT: The authenticated user's ID is "${session.user.id}". Pass this as userId when calling createDeveloperProfile.`;

  const provider = process.env.AI_DEFAULT_PROVIDER || "openai";

  const result = streamText({
    model: getModel(provider as ModelProvider),
    system: systemPrompt,
    messages: await convertToModelMessages(rawMessages),
    tools: developerTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}

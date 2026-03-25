import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai/gateway";
import type { ModelProvider } from "@/lib/ai/gateway";
import { aiTools } from "@/lib/ai/tools";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import type { ConversationPhase, PromptLocale } from "@/lib/ai/system-prompt";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: rawMessages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId?: string;
  };

  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await db.conversation.findUnique({
      where: { id: conversationId, userId: session.user.id },
    });
  }
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        status: "DISCOVERY",
        modelProvider: "openai",
      },
    });
  }

  const phase = (conversation.status as ConversationPhase) || "DISCOVERY";
  const locale = (session.user.locale as PromptLocale) || "en";
  const systemPrompt = getSystemPrompt(phase, locale);

  // Save user message to DB
  const lastUserMessage = rawMessages[rawMessages.length - 1];
  if (lastUserMessage?.role === "user") {
    const textParts = lastUserMessage.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text);
    const content = textParts.join("\n") || "";
    if (content) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content,
        },
      });
    }
  }

  const result = streamText({
    model: getModel(conversation.modelProvider as ModelProvider),
    system: systemPrompt,
    messages: await convertToModelMessages(rawMessages),
    tools: aiTools,
    stopWhen: stepCountIs(3),
    onFinish: async ({ text, toolCalls }) => {
      // Save assistant message
      if (text) {
        await db.message.create({
          data: {
            conversationId: conversation!.id,
            role: "ASSISTANT",
            content: text,
            metadata: toolCalls?.length
              ? { toolCalls: JSON.parse(JSON.stringify(toolCalls)) }
              : undefined,
          },
        });
      }

      // Auto-advance conversation phase based on tool usage
      if (toolCalls?.length) {
        const toolNames = toolCalls.map(
          (tc: { toolName: string }) => tc.toolName
        );
        let newStatus = conversation!.status;

        if (
          toolNames.includes("extractRequirements") &&
          phase === "DISCOVERY"
        ) {
          newStatus = "CONFIRMATION";
        } else if (
          toolNames.includes("searchDevelopers") &&
          phase === "CONFIRMATION"
        ) {
          newStatus = "MATCHING";
        }

        if (newStatus !== conversation!.status) {
          await db.conversation.update({
            where: { id: conversation!.id },
            data: { status: newStatus },
          });
        }
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "X-Conversation-Id": conversation.id },
  });
}

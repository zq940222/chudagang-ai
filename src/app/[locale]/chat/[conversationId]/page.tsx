import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getConversation } from "@/lib/actions/conversation";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale, conversationId } = await params;

  const result = await getConversation(conversationId);
  if (result.error || !result.data) notFound();

  const initialMessages = result.data.messages.map((m) => ({
    id: m.id,
    role: m.role.toLowerCase() as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: m.content }],
  }));

  return (
    <ChatInterface
      conversationId={conversationId}
      initialMessages={initialMessages}
      locale={locale as "zh" | "en"}
      className="flex-1 min-h-0"
    />
  );
}

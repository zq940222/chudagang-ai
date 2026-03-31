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

  return (
    <ChatInterface
      conversationId={conversationId}
      locale={locale as "zh" | "en"}
      className="flex-1 min-h-0"
    />
  );
}

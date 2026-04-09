import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  return (
    <ChatInterface locale={locale as "zh" | "en"} className="flex-1 min-h-0" />
  );
}

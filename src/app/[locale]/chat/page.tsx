import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/en/login");

  const { locale } = await params;

  return (
    <div className="flex h-screen flex-col">
      <Nav />
      <ChatInterface locale={locale as "zh" | "en"} className="flex-1 min-h-0" />
    </div>
  );
}

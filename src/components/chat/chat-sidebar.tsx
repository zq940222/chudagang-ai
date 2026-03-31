import { getMyConversations } from "@/lib/actions/conversation";
import { ChatSidebarClient } from "./chat-sidebar-client";

export async function ChatSidebar() {
  const result = await getMyConversations();
  const conversations = result.data ?? [];
  return <ChatSidebarClient conversations={conversations} />;
}

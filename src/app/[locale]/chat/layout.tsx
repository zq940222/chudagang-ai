import { Nav } from "@/components/nav";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatSidebarProvider } from "@/components/chat/chat-sidebar-context";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatSidebarProvider>
      <div className="flex h-screen flex-col">
        <Nav />
        <div className="flex flex-1 min-h-0">
          <ChatSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </ChatSidebarProvider>
  );
}

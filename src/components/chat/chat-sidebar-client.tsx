"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useChatSidebar } from "./chat-sidebar-context";

interface Conversation {
  id: string;
  status: string;
  updatedAt: string;
  messageCount: number;
  project: { id: string; title: string; status: string } | null;
}

const statusColors: Record<string, string> = {
  DISCOVERY: "bg-accent-cyan",
  CONFIRMATION: "bg-amber-400",
  MATCHING: "bg-violet-500",
  PUBLISHED: "bg-green-500",
  ABANDONED: "bg-on-surface-variant/30",
};

function groupByDate(conversations: Conversation[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: Conversation[] = [];
  const thisWeek: Conversation[] = [];
  const earlier: Conversation[] = [];

  for (const c of conversations) {
    const d = new Date(c.updatedAt);
    if (d >= todayStart) today.push(c);
    else if (d >= weekStart) thisWeek.push(c);
    else earlier.push(c);
  }

  return { today, thisWeek, earlier };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ChatSidebarClient({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const pathname = usePathname();
  const { open, close } = useChatSidebar();
  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/")[2]
    : undefined;

  const { today, thisWeek, earlier } = groupByDate(conversations);

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          {label}
        </p>
        {items.map((c) => {
          const isActive = c.id === activeId;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              onClick={close}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl mx-2 transition-colors ${
                isActive
                  ? "bg-surface-container"
                  : "hover:bg-surface-container"
              }`}
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusColors[c.status] ?? "bg-on-surface-variant/30"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-on-surface truncate">
                  {c.project?.title ?? "New Chat"}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {c.messageCount} message{c.messageCount !== 1 ? "s" : ""} ·{" "}
                  {relativeTime(c.updatedAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-black shadow-lg">
          AI
        </div>
        <span className="text-sm font-bold text-on-surface tracking-tight">
          AI Consultant
        </span>
      </div>

      {/* New Chat button */}
      <div className="px-4 pb-2">
        <Link
          href="/chat"
          onClick={close}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-on-primary text-sm font-bold py-2.5 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Chat
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-5 py-8 text-xs text-on-surface-variant text-center">
            No conversations yet
          </p>
        ) : (
          <>
            {renderGroup("Today", today)}
            {renderGroup("This Week", thisWeek)}
            {renderGroup("Earlier", earlier)}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-surface-container-lowest ghost-border shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={close}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-surface-container-lowest shadow-2xl lg:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

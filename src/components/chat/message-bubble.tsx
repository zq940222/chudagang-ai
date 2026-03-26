"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  children: ReactNode;
}

export function MessageBubble({ role, children }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-sm font-black shadow-lg">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm",
          isUser
            ? "bg-primary text-on-primary rounded-tr-none"
            : "bg-surface-container-lowest text-on-surface rounded-tl-none ghost-border"
        )}
      >
        {children}
      </div>
    </div>
  );
}

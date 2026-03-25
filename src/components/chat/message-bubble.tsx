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
      className={cn("flex gap-3 w-full", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-bold">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-on-primary rounded-br-md"
            : "bg-surface-container-highest text-on-surface rounded-bl-md"
        )}
      >
        {children}
      </div>
    </div>
  );
}

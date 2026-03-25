"use client";

import { useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { ProjectSummaryCard } from "./project-summary-card";
import { DeveloperRecommendations } from "./developer-recommendation";

interface ChatInterfaceProps {
  conversationId?: string;
  locale?: "zh" | "en";
  className?: string;
}

export function ChatInterface({
  conversationId,
  locale = "en",
  className,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: { conversationId },
    });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xl font-bold">
              AI
            </div>
            <h2 className="text-lg font-semibold text-on-surface">
              {locale === "zh"
                ? "你好！我是杵大岗AI项目顾问"
                : "Hello! I'm ChudagangAI Project Consultant"}
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md">
              {locale === "zh"
                ? "告诉我你想要构建什么，我会帮你梳理需求并找到合适的开发者。"
                : "Tell me what you'd like to build, and I'll help you clarify requirements and find the right developers."}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <MessageBubble role={message.role as "user" | "assistant"}>
              {message.content}
            </MessageBubble>

            {/* Render tool invocation results inline */}
            {message.toolInvocations?.map((invocation) => {
              if (invocation.state !== "result") return null;

              if (invocation.toolName === "extractRequirements") {
                return (
                  <ProjectSummaryCard
                    key={invocation.toolCallId}
                    project={invocation.result as {
                      title: string;
                      description: string;
                      skills: string[];
                      budget?: number | null;
                      timeline?: string | null;
                    }}
                  />
                );
              }

              if (invocation.toolName === "searchDevelopers") {
                const result = invocation.result as {
                  developers: {
                    id: string;
                    name: string;
                    title?: string;
                    skills?: string[];
                    rating?: number;
                    hourlyRate?: number;
                  }[];
                };
                return (
                  <DeveloperRecommendations
                    key={invocation.toolCallId}
                    developers={result.developers}
                  />
                );
              }

              return null;
            })}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-bold">
              AI
            </div>
            <div className="rounded-2xl rounded-bl-md bg-surface-container-highest px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mx-auto max-w-md rounded-lg bg-error/10 text-error px-4 py-2 text-sm">
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-outline-variant/20 p-4"
      >
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              locale === "zh" ? "描述你的项目需求..." : "Describe your project needs..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" variant="primary" size="md" disabled={isLoading || !input.trim()}>
            {locale === "zh" ? "发送" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
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
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";

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
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <MessageBubble
                      key={`${message.id}-text-${i}`}
                      role={message.role as "user" | "assistant"}
                    >
                      {part.text}
                    </MessageBubble>
                  );
                case "tool-extractRequirements":
                  if (part.state === "output-available") {
                    return (
                      <ProjectSummaryCard
                        key={`${message.id}-tool-${i}`}
                        project={part.output as {
                          title: string;
                          description: string;
                          skills: string[];
                          budget?: number | null;
                          timeline?: string | null;
                        }}
                      />
                    );
                  }
                  return null;
                case "tool-searchDevelopers":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      developers: any[];
                    };
                    return (
                      <DeveloperRecommendations
                        key={`${message.id}-tool-${i}`}
                        developers={result.developers}
                      />
                    );
                  }
                  return null;
                case "tool-createProjectDraft":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      project: { id: string; title: string };
                    };
                    return (
                      <div
                        key={`${message.id}-tool-${i}`}
                        className="mx-auto max-w-sm rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-4 text-center"
                      >
                        <p className="text-sm font-medium text-on-surface">
                          {locale === "zh" ? "项目草稿已创建" : "Project draft created"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {result.project.title}
                        </p>
                        <Button variant="secondary" size="sm" className="mt-3 w-full" asChild>
                          <a href={`/${locale}/dashboard/client/projects`}>
                            {locale === "zh" ? "前往管理" : "Manage Project"}
                          </a>
                        </Button>
                      </div>
                    );
                  }
                  return null;
                default:
                  return null;
              }
            })}
          </div>
        ))}

        {/* Loading indicator */}
        {isBusy && (
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
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex-shrink-0 border-t border-outline-variant/20 p-4"
      >
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              locale === "zh" ? "描述你的项目需求..." : "Describe your project needs..."
            }
            disabled={isBusy}
            className="flex-1"
          />
          <Button type="submit" variant="primary" size="md" disabled={isBusy || !input.trim()}>
            {locale === "zh" ? "发送" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}

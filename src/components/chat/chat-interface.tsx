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
    <div className={cn("flex flex-col h-full bg-surface", className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 glass ghost-border-b bg-surface/50 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-black">
            AI
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">
              {locale === "zh" ? "AI 项目顾问" : "AI Project Consultant"}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {isEmpty && (
          <div className=”flex flex-col items-center justify-center h-full text-center space-y-8 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-700”>
            <div className=”w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-4xl font-black shadow-2xl shadow-primary/20”>
              AI
            </div>
            <div className=”space-y-3”>
              <h2 className=”text-3xl font-extrabold tracking-tight text-on-surface”>
                {locale === “zh”
                  ? “准备好开始了吗？”
                  : “Ready to start?”}
              </h2>
              <p className=”text-sm text-on-surface-variant leading-relaxed”>
                {locale === “zh”
                  ? “描述您的项目构思，我将为您精准提取需求并匹配顶尖开发者。”
                  : “Describe your project idea, and I'll extract requirements and find the best developers for you.”}
              </p>
            </div>
            <div className=”grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-2”>
              <button
                onClick={() => sendMessage({ text: locale === “zh” ? “我想做一个移动应用” : “I want to build a mobile app” })}
                className=”flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left”
              >
                <svg className=”w-5 h-5 text-accent-cyan” fill=”none” viewBox=”0 0 24 24” strokeWidth={1.5} stroke=”currentColor”>
                  <path strokeLinecap=”round” strokeLinejoin=”round” d=”M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3” />
                </svg>
                <span className=”text-xs font-bold text-on-surface”>
                  {locale === “zh” ? “移动应用” : “Mobile App”}
                </span>
                <span className=”text-[11px] text-on-surface-variant leading-snug”>
                  {locale === “zh” ? “构建 iOS 或 Android 应用” : “Build an iOS or Android app”}
                </span>
              </button>
              <button
                onClick={() => sendMessage({ text: locale === “zh” ? “我需要一个网站” : “I need a website” })}
                className=”flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left”
              >
                <svg className=”w-5 h-5 text-violet-500” fill=”none” viewBox=”0 0 24 24” strokeWidth={1.5} stroke=”currentColor”>
                  <path strokeLinecap=”round” strokeLinejoin=”round” d=”M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418” />
                </svg>
                <span className=”text-xs font-bold text-on-surface”>
                  {locale === “zh” ? “网站开发” : “Website”}
                </span>
                <span className=”text-[11px] text-on-surface-variant leading-snug”>
                  {locale === “zh” ? “设计并开发现代网站” : “Design and build a modern website”}
                </span>
              </button>
              <button
                onClick={() => sendMessage({ text: locale === “zh” ? “我需要 AI 技术咨询” : “I need AI technical consulting” })}
                className=”flex flex-col items-start gap-2 px-4 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left”
              >
                <svg className=”w-5 h-5 text-secondary” fill=”none” viewBox=”0 0 24 24” strokeWidth={1.5} stroke=”currentColor”>
                  <path strokeLinecap=”round” strokeLinejoin=”round” d=”M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z” />
                </svg>
                <span className=”text-xs font-bold text-on-surface”>
                  {locale === “zh” ? “AI 咨询” : “AI Guidance”}
                </span>
                <span className=”text-[11px] text-on-surface-variant leading-snug”>
                  {locale === “zh” ? “获取 AI 技术方案建议” : “Get AI technical consulting”}
                </span>
              </button>
            </div>
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
                        className="hover:shadow-md transition-shadow"
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
                        key={`${message.id}-tool-${i}`}
                        className="hover:shadow-md transition-shadow"
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-bold shadow-lg">
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
        className="flex-shrink-0 p-4 sm:p-6"
      >
        <div className="relative max-w-3xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/20 to-tertiary/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 glass rounded-2xl p-2 ghost-border shadow-2xl shadow-primary/5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === "zh" ? "描述您的项目需求..." : "Describe your project needs..."
              }
              disabled={isBusy}
              className="flex-1 border-none focus-visible:ring-0 bg-transparent text-base py-6 rounded-2xl"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isBusy || !input.trim()}
              className="rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0 bg-gradient-to-r from-primary to-accent-cyan border-none shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

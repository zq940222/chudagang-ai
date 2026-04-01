"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MessageBubble } from "@/components/chat/message-bubble";
import { OptionsCard, FormCard } from "@/components/chat/interactive-options";
import { ProjectSummaryCard } from "@/components/chat/project-summary-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProjectPublishChat() {
  const locale = useLocale();
  const t = useTranslations("projectChat");
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [status, messages.length]);

  const handleSubmit = (text?: string) => {
    const value = text ?? input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const isEmpty = messages.length === 0;

  // Empty state: input-first
  if (isEmpty) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-2xl font-black shadow-xl shadow-primary/20">
              AI
            </div>
            <h3 className="text-lg font-bold tracking-tight text-on-surface">
              {t("welcomeTitle")}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed max-w-md">
              {t("welcomeDesc")}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-cyan/30 to-tertiary/30 rounded-2xl blur opacity-40 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3 glass rounded-2xl p-3 ghost-border shadow-2xl shadow-primary/5">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-sm font-black shadow-lg">
                  AI
                </div>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("placeholder")}
                  disabled={isBusy}
                  autoFocus
                  className="flex-1 border-none focus-visible:ring-0 bg-transparent text-base py-4 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={isBusy || !input.trim()}
                  className="rounded-xl h-10 w-10 flex items-center justify-center shrink-0 bg-gradient-to-r from-primary to-accent-cyan text-on-primary disabled:opacity-40 transition-opacity shadow-lg shadow-primary/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
            {(["prompt1", "prompt2", "prompt3"] as const).map((key) => (
              <button
                key={key}
                onClick={() => handleSubmit(t(key))}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-xs font-medium text-on-surface"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active chat
  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  if (!part.text.trim()) return null;
                  return (
                    <MessageBubble
                      key={`${message.id}-text-${i}`}
                      role={message.role as "user" | "assistant"}
                    >
                      {part.text}
                    </MessageBubble>
                  );
                case "reasoning":
                  return null;
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
                case "tool-createProjectDraft":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      project: { id: string; title: string };
                    };
                    return (
                      <div
                        key={`${message.id}-tool-${i}`}
                        className="mx-auto max-w-sm rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-5 text-center space-y-3"
                      >
                        <div className="mx-auto w-10 h-10 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-on-surface">
                          {locale === "zh" ? "项目已创建" : "Project Created"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {result.project.title}
                        </p>
                        <Button variant="secondary" size="sm" className="w-full" asChild>
                          <a href={`/${locale}/dashboard/client/projects`}>
                            {locale === "zh" ? "前往管理" : "Manage Project"}
                          </a>
                        </Button>
                      </div>
                    );
                  }
                  return null;
                case "tool-estimateBudget":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      currency: string;
                      low: number;
                      high: number;
                      breakdown: { complexity: string; timelineWeeks: number };
                    };
                    return (
                      <div
                        key={`${message.id}-tool-${i}`}
                        className="rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 p-4 space-y-2"
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                          {locale === "zh" ? "预算估算" : "Budget Estimate"}
                        </p>
                        <p className="text-xl font-black text-on-surface">
                          ¥{result.low.toLocaleString()} - ¥{result.high.toLocaleString()}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {locale === "zh"
                            ? `复杂度: ${result.breakdown.complexity} · 周期: ${result.breakdown.timelineWeeks} 周`
                            : `Complexity: ${result.breakdown.complexity} · Timeline: ${result.breakdown.timelineWeeks} weeks`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                case "tool-presentOptions":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      question: string;
                      options: { label: string; value: string; description?: string; icon?: string }[];
                      allowMultiple: boolean;
                    };
                    return (
                      <OptionsCard
                        key={`${message.id}-tool-${i}`}
                        question={result.question}
                        options={result.options}
                        allowMultiple={result.allowMultiple}
                        onSelect={(value) => handleSubmit(value)}
                        disabled={isBusy}
                      />
                    );
                  }
                  return null;
                case "tool-presentForm":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      title: string;
                      fields: { name: string; label: string; type: "text" | "number" | "select" | "textarea"; placeholder?: string; options?: { label: string; value: string }[]; required?: boolean }[];
                      submitLabel: string;
                    };
                    return (
                      <FormCard
                        key={`${message.id}-tool-${i}`}
                        title={result.title}
                        fields={result.fields}
                        submitLabel={result.submitLabel}
                        onSubmit={(value) => handleSubmit(value)}
                        disabled={isBusy}
                      />
                    );
                  }
                  return null;
                default:
                  return null;
              }
            })}
          </div>
        ))}

        {isBusy && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-[10px] font-bold">
              AI
            </div>
            <div className="rounded-xl rounded-bl-md bg-surface-container-highest px-3 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-error/10 text-error px-3 py-2 text-xs">
            {error.message}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex-shrink-0 px-6 py-4 border-t border-outline-variant/10"
      >
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-cyan/20 to-tertiary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 glass rounded-xl p-2 ghost-border">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={isBusy}
              autoFocus
              className="flex-1 border-none focus-visible:ring-0 bg-transparent text-sm py-3 rounded-xl"
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="rounded-lg h-9 w-9 flex items-center justify-center shrink-0 bg-gradient-to-r from-primary to-accent-cyan text-on-primary disabled:opacity-40 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

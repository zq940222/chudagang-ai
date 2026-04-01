"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAmount } from "@/lib/currency";

export function ExpertMatchChat() {
  const locale = useLocale();
  const t = useTranslations("expertChat");
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const isEmpty = messages.length === 0;

  const handleSubmit = (text?: string) => {
    const value = text ?? input.trim();
    if (!value) return;
    sendMessage({ text: value });
    setInput("");
  };

  // Empty state: input-first layout
  if (isEmpty) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Big input */}
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

          {/* Quick prompts */}
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

  // Active chat layout
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth">
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
                        currency?: string;
                      }[];
                    };
                    return (
                      <ExpertCards
                        key={`${message.id}-tool-${i}`}
                        developers={result.developers}
                        locale={locale}
                      />
                    );
                  }
                  return null;
                case "tool-extractRequirements":
                  if (part.state === "output-available") {
                    const result = part.output as {
                      title: string;
                      description: string;
                      skills: string[];
                    };
                    return (
                      <div
                        key={`${message.id}-tool-${i}`}
                        className="rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 p-4 space-y-2"
                      >
                        <p className="text-sm font-bold text-secondary">{result.title}</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{result.description}</p>
                        {result.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.skills.map((s) => (
                              <Badge key={s} variant="outline">{s}</Badge>
                            ))}
                          </div>
                        )}
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

      {/* Sticky input bar */}
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={isBusy}
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

function ExpertCards({
  developers,
  locale,
}: {
  developers: {
    id: string;
    name: string;
    title?: string;
    skills?: string[];
    rating?: number;
    hourlyRate?: number;
    currency?: string;
  }[];
  locale: string;
}) {
  const t = useTranslations("expertChat");
  if (!developers?.length) return null;

  return (
    <div className="space-y-2 my-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
        {t("recommended")}
      </p>
      {developers.map((dev) => (
        <Link
          key={dev.id}
          href={`/developers/${dev.id}`}
          className="flex items-start gap-3 rounded-xl bg-surface-container-lowest ghost-border p-3 hover:bg-surface-container-high transition-colors group"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary text-sm font-black">
            {dev.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm text-on-surface truncate group-hover:text-secondary transition-colors">
                {dev.name}
              </span>
              {dev.rating != null && (
                <span className="flex items-center gap-0.5 text-xs text-secondary font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                  </svg>
                  {dev.rating.toFixed(1)}
                </span>
              )}
            </div>
            {dev.title && (
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{dev.title}</p>
            )}
            {dev.skills?.length ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {dev.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-block rounded-md bg-surface-container-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant"
                  >
                    {skill}
                  </span>
                ))}
                {dev.skills.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant">
                    +{dev.skills.length - 3}
                  </span>
                )}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {dev.hourlyRate != null && (
              <span className="text-xs font-bold text-on-surface">
                {formatCurrencyAmount(dev.hourlyRate, dev.currency ?? "CNY")}
                <span className="text-[10px] font-normal text-on-surface-variant">
                  {locale === "zh" ? "/小时" : "/hr"}
                </span>
              </span>
            )}
            <span className="text-[10px] font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
              {t("viewDetail")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

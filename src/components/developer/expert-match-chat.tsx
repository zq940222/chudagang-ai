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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-xs font-black shadow-lg">
          AI
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-on-surface truncate">
            {t("title")}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
              {t("online")}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5 px-2 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-2xl font-black shadow-xl shadow-primary/20">
              AI
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold tracking-tight text-on-surface">
                {t("welcomeTitle")}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t("welcomeDesc")}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {[
                { key: "prompt1", icon: "mobile" },
                { key: "prompt2", icon: "ai" },
                { key: "prompt3", icon: "web" },
              ].map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => sendMessage({ text: t(key) })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors ghost-border text-left"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {icon === "mobile" && (
                      <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                    )}
                    {icon === "ai" && (
                      <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                    )}
                    {icon === "web" && (
                      <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs font-medium text-on-surface">
                    {t(key)}
                  </span>
                </button>
              ))}
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
                        className="rounded-xl bg-accent-cyan/5 border border-accent-cyan/20 p-3 space-y-2"
                      >
                        <p className="text-xs font-bold text-secondary">{result.title}</p>
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
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary text-[10px] font-bold">
              AI
            </div>
            <div className="rounded-xl rounded-bl-md bg-surface-container-highest px-3 py-2">
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

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex-shrink-0 p-3 border-t border-outline-variant/10"
      >
        <div className="flex items-center gap-2 glass rounded-xl p-1.5 ghost-border">
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

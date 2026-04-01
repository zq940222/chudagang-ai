"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  mobile: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  ),
  web: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  ai: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  ),
  api: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6c4.142 0 7.5-1.343 7.5-3s-3.358-3-7.5-3-7.5 1.343-7.5 3 3.358 3 7.5 3Zm7.5 4.5c0 1.657-3.358 3-7.5 3s-7.5-1.343-7.5-3m15 4.5c0 1.657-3.358 3-7.5 3s-7.5-1.343-7.5-3m15-4.5v9c0 1.657-3.358 3-7.5 3s-7.5-1.343-7.5-3v-9" />
    </svg>
  ),
  cloud: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75h3.75a3 3 0 0 0 0-6h-.215a5.25 5.25 0 1 0-9.285 4.5A3 3 0 0 0 6 18.75h6Z" />
    </svg>
  ),
  design: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25Z" />
    </svg>
  ),
};

interface Option {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

interface OptionsCardProps {
  question: string;
  options: Option[];
  allowMultiple: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function OptionsCard({
  question,
  options,
  allowMultiple,
  onSelect,
  disabled,
}: OptionsCardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleClick = (value: string) => {
    if (disabled || submitted) return;

    if (!allowMultiple) {
      setSubmitted(true);
      onSelect(value);
      return;
    }

    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmitMultiple = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
    onSelect(selected.join(", "));
  };

  return (
    <div className="rounded-2xl bg-surface-container-lowest ghost-border p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-medium text-on-surface">{question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = submitted
            ? (!allowMultiple ? opt.value === selected[0] : selected.includes(opt.value))
            : selected.includes(opt.value);

          return (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              disabled={disabled || submitted}
              className={cn(
                "flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all border",
                submitted
                  ? isSelected
                    ? "bg-primary/10 border-primary/30 text-on-surface"
                    : "opacity-40 border-transparent bg-surface-container"
                  : isSelected
                    ? "bg-accent-cyan/10 border-accent-cyan/40 text-on-surface ring-1 ring-accent-cyan/30"
                    : "border-outline-variant/15 bg-surface-container hover:bg-surface-container-high hover:border-outline-variant/30"
              )}
            >
              {opt.icon && iconMap[opt.icon] && (
                <span className={cn(
                  "flex-shrink-0 mt-0.5",
                  isSelected ? "text-primary" : "text-on-surface-variant/60"
                )}>
                  {iconMap[opt.icon]}
                </span>
              )}
              <div className="min-w-0">
                <span className="text-sm font-bold">{opt.label}</span>
                {opt.description && (
                  <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5">
                    {opt.description}
                  </p>
                )}
              </div>
              {allowMultiple && !submitted && (
                <span className={cn(
                  "ml-auto flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors",
                  isSelected
                    ? "bg-accent-cyan border-accent-cyan text-white"
                    : "border-outline-variant/40"
                )}>
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {allowMultiple && !submitted && (
        <button
          onClick={handleSubmitMultiple}
          disabled={selected.length === 0}
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-40 transition-opacity"
        >
          确认选择 ({selected.length})
        </button>
      )}
    </div>
  );
}

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface FormCardProps {
  title: string;
  fields: FormField[];
  submitLabel: string;
  onSubmit: (values: string) => void;
  disabled?: boolean;
}

export function FormCard({
  title,
  fields,
  submitLabel,
  onSubmit,
  disabled,
}: FormCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    const parts = fields
      .map((f) => {
        const v = values[f.name]?.trim();
        if (!v) return null;
        return `${f.label}: ${v}`;
      })
      .filter(Boolean);

    if (parts.length === 0) return;
    setSubmitted(true);
    onSubmit(parts.join("\n"));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-2xl bg-surface-container-lowest ghost-border p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        submitted && "opacity-70"
      )}
    >
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {field.label}
              {field.required !== false && <span className="text-error ml-0.5">*</span>}
            </label>
            {field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                disabled={disabled || submitted}
                className="w-full rounded-lg bg-surface-container px-3 py-2.5 text-sm text-on-surface ghost-border focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              >
                <option value="">{field.placeholder ?? "请选择..."}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                value={values[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled || submitted}
                rows={3}
                className="w-full rounded-lg bg-surface-container px-3 py-2.5 text-sm text-on-surface ghost-border focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 resize-none"
              />
            ) : (
              <input
                type={field.type}
                value={values[field.name] ?? ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled || submitted}
                className="w-full rounded-lg bg-surface-container px-3 py-2.5 text-sm text-on-surface ghost-border focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              />
            )}
          </div>
        ))}
      </div>
      {!submitted && (
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-40 transition-opacity"
        >
          {submitLabel}
        </button>
      )}
      {submitted && (
        <p className="text-xs text-secondary font-medium text-center">
          ✓ 已提交
        </p>
      )}
    </form>
  );
}

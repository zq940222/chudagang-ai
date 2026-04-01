"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface FilterCategory {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface FilterSidebarProps {
  categories: FilterCategory[];
  showBudgetRange?: boolean;
  showRateRange?: boolean;
  budgetLabel?: string;
  rateLabel?: string;
  applyLabel?: string;
  selectedRangeLabel?: string;
}

interface RangeControlProps {
  minAllowed: number;
  maxAllowed: number;
  step: number;
  initialMin: number;
  initialMax: number;
  formatValue: (value: number) => string;
  label: string;
  isBudgetRange?: boolean;
  onCommit: (nextMin: number, nextMax: number) => void;
}

function RangeControl({
  minAllowed,
  maxAllowed,
  step,
  initialMin,
  initialMax,
  formatValue,
  label,
  isBudgetRange,
  onCommit,
}: RangeControlProps) {
  const [localMin, setLocalMin] = useState(initialMin);
  const [localMax, setLocalMax] = useState(initialMax);
  const minPercent = ((localMin - minAllowed) / (maxAllowed - minAllowed)) * 100;
  const maxPercent = ((localMax - minAllowed) / (maxAllowed - minAllowed)) * 100;

  return (
    <>
      <div className="mb-4 rounded-[1.4rem] liquid-glass-vivid liquid-panel px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
          {label}
        </div>
        <div className="mt-2 flex items-center justify-between text-sm font-bold text-on-surface">
          <span className="text-secondary">{formatValue(localMin)}</span>
          <span className="text-on-surface-variant/60">to</span>
          <span className="text-primary">{formatValue(localMax)}</span>
        </div>
      </div>

      <div className="relative px-1 py-9">
        <div className="absolute left-1 right-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(236,229,220,0.95),rgba(219,210,198,0.72))]" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#9ad7cf_0%,#d4b185_100%)] shadow-[0_0_20px_rgba(154,215,207,0.5)]"
          style={{
            left: `calc(${minPercent}% + 0.25rem)`,
            right: `calc(${100 - maxPercent}% + 0.25rem)`,
          }}
        />

        <div
          className="absolute top-0 rounded-xl bg-[linear-gradient(145deg,#223245,#101820)] px-2.5 py-1 text-[11px] font-bold text-on-primary shadow-[0_10px_20px_rgba(18,21,28,0.18)]"
          style={{ left: `calc(${minPercent}% - 1.75rem)` }}
        >
          {formatValue(localMin)}
        </div>
        <div
          className="absolute top-0 rounded-xl bg-[linear-gradient(145deg,#cfb489,#a98660)] px-2.5 py-1 text-[11px] font-bold text-on-primary shadow-[0_10px_20px_rgba(18,21,28,0.18)]"
          style={{ left: `calc(${maxPercent}% - 1.75rem)` }}
        >
          {formatValue(localMax)}
        </div>

        <input
          type="range"
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-11px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[linear-gradient(145deg,#9ad7cf,#5f756d)] [&::-webkit-slider-thumb]:shadow-[0_10px_24px_rgba(18,21,28,0.18)]"
          min={minAllowed}
          max={maxAllowed}
          step={step}
          value={localMin}
          onChange={(e) => {
            const nextMin = Math.min(Number(e.target.value), localMax - step);
            setLocalMin(nextMin);
          }}
          onMouseUp={() => onCommit(localMin, localMax)}
          onTouchEnd={() => onCommit(localMin, localMax)}
        />
        <input
          type="range"
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-11px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[linear-gradient(145deg,#d4b185,#cf8a7a)] [&::-webkit-slider-thumb]:shadow-[0_10px_24px_rgba(18,21,28,0.18)]"
          min={minAllowed}
          max={maxAllowed}
          step={step}
          value={localMax}
          onChange={(e) => {
            const nextMax = Math.max(Number(e.target.value), localMin + step);
            setLocalMax(nextMax);
          }}
          onMouseUp={() => onCommit(localMin, localMax)}
          onTouchEnd={() => onCommit(localMin, localMax)}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
        <span>{formatValue(minAllowed)}</span>
        <span>{isBudgetRange ? "¥100,000+" : "$500+"}</span>
      </div>
    </>
  );
}

function getCategoryAccentClass(value: string, active: boolean) {
  if (!active) return "text-on-surface-variant/72";

  switch (value) {
    case "llm":
      return "bg-[linear-gradient(135deg,rgba(154,215,207,0.24),rgba(255,255,255,0.7))] text-[#0f6f67] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "rag":
      return "bg-[linear-gradient(135deg,rgba(111,190,222,0.24),rgba(255,255,255,0.72))] text-[#2f6d8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "vision":
      return "bg-[linear-gradient(135deg,rgba(212,177,133,0.28),rgba(255,255,255,0.72))] text-[#95613a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "multimodal":
      return "bg-[linear-gradient(135deg,rgba(169,131,216,0.24),rgba(255,255,255,0.72))] text-[#6d48a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "audio":
      return "bg-[linear-gradient(135deg,rgba(247,190,82,0.24),rgba(255,255,255,0.72))] text-[#9c661a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "agent":
      return "bg-[linear-gradient(135deg,rgba(74,176,128,0.24),rgba(255,255,255,0.72))] text-[#25684f] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "deployment":
      return "bg-[linear-gradient(135deg,rgba(111,146,232,0.24),rgba(255,255,255,0.72))] text-[#365fa5] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "automation":
      return "bg-[linear-gradient(135deg,rgba(232,132,145,0.24),rgba(255,255,255,0.72))] text-[#9a4d5a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "data":
      return "bg-[linear-gradient(135deg,rgba(110,123,255,0.24),rgba(255,255,255,0.72))] text-[#4b58c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "evaluation":
      return "bg-[linear-gradient(135deg,rgba(252,166,94,0.24),rgba(255,255,255,0.72))] text-[#b56214] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "product":
      return "bg-[linear-gradient(135deg,rgba(242,131,169,0.24),rgba(255,255,255,0.72))] text-[#a43f6a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "neural":
      return "bg-[linear-gradient(135deg,rgba(169,131,216,0.22),rgba(255,255,255,0.72))] text-[#6d48a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "other":
      return "bg-[linear-gradient(135deg,rgba(156,163,175,0.2),rgba(255,255,255,0.72))] text-[#4b5563] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    case "deploy":
      return "bg-[linear-gradient(135deg,rgba(111,190,222,0.24),rgba(255,255,255,0.72))] text-[#2f6d8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
    default:
      return "bg-[linear-gradient(135deg,rgba(154,215,207,0.2),rgba(255,255,255,0.7))] text-[#1f5d57] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_24px_rgba(18,21,28,0.06)]";
  }
}

export function FilterSidebar({
  categories,
  showBudgetRange,
  showRateRange,
  budgetLabel = "Budget Range",
  rateLabel = "Hourly Rate",
  applyLabel = "Apply Filters",
  selectedRangeLabel = "Selected Range",
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";
  const minAllowed = showBudgetRange ? 0 : 50;
  const maxAllowed = showBudgetRange ? 100000 : 500;
  const step = showBudgetRange ? 1000 : 10;
  const minKey = showBudgetRange ? "minBudget" : "minRate";
  const maxKey = showBudgetRange ? "maxBudget" : "maxRate";
  const parsedMin = Number(searchParams.get(minKey) ?? minAllowed);
  const parsedMax = Number(searchParams.get(maxKey) ?? maxAllowed);
  const currentMin = Number.isFinite(parsedMin)
    ? Math.min(Math.max(parsedMin, minAllowed), maxAllowed)
    : minAllowed;
  const currentMax = Number.isFinite(parsedMax)
    ? Math.max(Math.min(parsedMax, maxAllowed), minAllowed)
    : maxAllowed;
  const safeMin = Math.min(currentMin, currentMax);
  const safeMax = Math.max(currentMin, currentMax);
  const formatValue = (value: number) =>
    showBudgetRange ? `¥${value.toLocaleString()}` : `$${value}`;

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const updateRangeParams = useCallback(
    (nextMin: number, nextMax: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(minKey, String(nextMin));
      params.set(maxKey, String(nextMax));
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [maxKey, minKey, pathname, router, searchParams]
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col space-y-8 border-r border-outline-variant/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))] p-6 lg:flex">
      <div>
        <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
          Marketplace Filters
        </h5>
        <nav className="space-y-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => {
                  updateParams("category", cat.value === "all" ? null : cat.value);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-all duration-200",
                  isActive
                    ? `${getCategoryAccentClass(cat.value, true)} border-white/55`
                    : "border-transparent bg-transparent text-on-surface-variant/70 hover:border-white/40 hover:bg-white/55 hover:text-on-surface"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    isActive
                      ? "bg-white/65 text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : "bg-surface-container/60 text-on-surface-variant/50 group-hover:bg-white/70 group-hover:text-on-surface"
                  )}
                >
                  {cat.icon}
                </span>
                <span className="flex-1">{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {(showBudgetRange || showRateRange) && (
        <div className="border-t border-outline-variant/10 pt-4">
          <h5 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
            {showBudgetRange ? budgetLabel : rateLabel}
          </h5>
          <RangeControl
            key={`${minKey}:${maxKey}:${safeMin}:${safeMax}`}
            minAllowed={minAllowed}
            maxAllowed={maxAllowed}
            step={step}
            initialMin={safeMin}
            initialMax={safeMax}
            formatValue={formatValue}
            label={selectedRangeLabel}
            isBudgetRange={showBudgetRange}
            onCommit={updateRangeParams}
          />
        </div>
      )}

      <button
        onClick={() => router.push(pathname)}
        className="mt-auto w-full rounded-xl bg-primary py-3 text-xs font-bold uppercase tracking-widest text-on-primary"
      >
        {applyLabel}
      </button>
    </aside>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useCallback } from "react";
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
  const minPercent = ((safeMin - minAllowed) / (maxAllowed - minAllowed)) * 100;
  const maxPercent = ((safeMax - minAllowed) / (maxAllowed - minAllowed)) * 100;
  const formatValue = (value: number) =>
    showBudgetRange
      ? `$${value.toLocaleString()}`
      : `$${value}`;

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
    <aside className="hidden lg:flex flex-col w-64 bg-surface-container-low/50 border-r border-outline-variant/10 shrink-0 p-6 space-y-8">
      {/* Categories */}
      <div>
        <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-4">
          Marketplace Filters
        </h5>
        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                updateParams(
                  "category",
                  cat.value === "all" ? null : cat.value
                );
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm w-full text-left transition-all",
                activeCategory === cat.value
                  ? "bg-surface-container-lowest text-accent-cyan shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container/50"
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Budget/Rate Range */}
      {(showBudgetRange || showRateRange) && (
        <div className="pt-4 border-t border-outline-variant/10">
          <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-4">
            {showBudgetRange ? budgetLabel : rateLabel}
          </h5>
          <div className="mb-3 rounded-2xl liquid-glass-vivid liquid-panel px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/70">
              {selectedRangeLabel}
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-on-surface">
              <span>{formatValue(safeMin)}</span>
              <span className="text-on-surface-variant">-</span>
              <span>{formatValue(safeMax)}</span>
            </div>
          </div>
          <div className="relative px-1 pb-8 pt-10">
            <div className="absolute left-1 right-1 top-[3.05rem] h-1.5 rounded-full bg-surface-container-highest" />
            <div
              className="absolute top-[3.05rem] h-1.5 rounded-full bg-secondary"
              style={{
                left: `calc(${minPercent}% + 0.25rem)`,
                right: `calc(${100 - maxPercent}% + 0.25rem)`,
              }}
            />
            <div
              className="absolute top-1 rounded-xl bg-primary px-2 py-1 text-[11px] font-bold text-on-primary shadow-lg"
              style={{ left: `calc(${minPercent}% - 1.5rem)` }}
            >
              {formatValue(safeMin)}
            </div>
            <div
              className="absolute top-1 rounded-xl bg-primary px-2 py-1 text-[11px] font-bold text-on-primary shadow-lg"
              style={{ left: `calc(${maxPercent}% - 1.5rem)` }}
            >
              {formatValue(safeMax)}
            </div>
            <input
              type="range"
              className="pointer-events-none absolute left-0 right-0 top-9 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:shadow-md"
              min={minAllowed}
              max={maxAllowed}
              step={step}
              value={safeMin}
              onChange={(e) => {
                const nextMin = Math.min(Number(e.target.value), safeMax - step);
                updateRangeParams(nextMin, safeMax);
              }}
            />
            <input
              type="range"
              className="pointer-events-none absolute left-0 right-0 top-9 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
              min={minAllowed}
              max={maxAllowed}
              step={step}
              value={safeMax}
              onChange={(e) => {
                const nextMax = Math.max(Number(e.target.value), safeMin + step);
                updateRangeParams(safeMin, nextMax);
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant mt-2">
            <span>{formatValue(minAllowed)}</span>
            <span>{showBudgetRange ? "$100,000+" : "$500+"}</span>
          </div>
        </div>
      )}

      {/* Apply */}
      <button
        onClick={() => router.push(pathname)}
        className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-xs uppercase tracking-widest mt-auto"
      >
        {applyLabel}
      </button>
    </aside>
  );
}

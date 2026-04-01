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
}

export function FilterSidebar({
  categories,
  showBudgetRange,
  showRateRange,
  budgetLabel = "Budget Range",
  rateLabel = "Hourly Rate",
  applyLabel = "Apply Filters",
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";

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
          <input
            type="range"
            className="w-full accent-secondary"
            min={showBudgetRange ? 0 : 50}
            max={showBudgetRange ? 100000 : 500}
            step={showBudgetRange ? 1000 : 10}
            onChange={(e) => {
              const key = showBudgetRange ? "maxBudget" : "maxRate";
              updateParams(key, e.target.value);
            }}
          />
          <div className="flex justify-between text-xs text-on-surface-variant mt-2">
            <span>{showBudgetRange ? "$0" : "$50"}</span>
            <span>{showBudgetRange ? "$100k+" : "$500+"}</span>
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

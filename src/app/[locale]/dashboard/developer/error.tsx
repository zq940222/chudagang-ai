"use client";

import { useEffect } from "react";

export default function DeveloperDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DeveloperDashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h2 className="text-xl font-bold text-error">页面加载失败</h2>
      <p className="max-w-md text-sm text-on-surface-variant font-mono">
        {error.message || "未知错误"}
      </p>
      {error.digest && (
        <p className="text-xs text-on-surface-variant/60">错误ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary"
      >
        重试
      </button>
    </div>
  );
}

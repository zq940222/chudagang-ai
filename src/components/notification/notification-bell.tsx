"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE connection for real-time notifications
  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    eventSourceRef.current = es;

    es.addEventListener("count", (e) => {
      const data = JSON.parse(e.data);
      setCount((prev) => {
        if (data.count > prev) setFlash(true);
        return data.count;
      });
    });

    es.addEventListener("notification", () => {
      // Flash the bell when new notification arrives
      setFlash(true);
    });

    es.onerror = () => {
      // Reconnect is handled automatically by EventSource
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  // Clear flash animation
  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Count will update via SSE automatically after markAsRead
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [handleClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface ${flash ? "animate-wiggle" : ""}`}
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-primary animate-pulse">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && <NotificationDropdown onClose={handleClose} />}
    </div>
  );
}

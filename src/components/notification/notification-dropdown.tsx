"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationDropdown({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyNotifications().then((result) => {
      if (result.data) setNotifications(result.data);
      setLoading(false);
    });
  }, []);

  async function handleRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Store render timestamp in a ref to avoid impure Date.now() in render
  const renderTime = useRef(Date.now());
  useEffect(() => {
    renderTime.current = Date.now();
  }, [notifications]);

  function timeAgo(dateStr: string) {
    const diff = renderTime.current - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface-container-low shadow-xl ghost-border z-50">
      <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-on-surface">{t("title")}</h3>
        <Button variant="tertiary" size="sm" onClick={handleMarkAll}>
          {t("markAllRead")}
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">{t("loading")}</p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">{t("empty")}</p>
        ) : (
          notifications.map((n) => (
            <a
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => {
                if (!n.read) handleRead(n.id);
                onClose?.();
              }}
              className={`block border-b border-outline-variant/5 px-4 py-3 transition-colors hover:bg-surface-container ${
                !n.read ? "bg-accent-cyan/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-on-surface`}>{n.title}</p>
                <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
              {!n.read && (
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent-cyan" />
              )}
            </a>
          ))
        )}
      </div>
    </div>
  );
}

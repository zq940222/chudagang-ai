"use client";

import { useState, useEffect } from "react";
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

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
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

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface-container-low shadow-xl ghost-border z-50">
      <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
        <Button variant="tertiary" size="sm" onClick={handleMarkAll}>
          Mark all read
        </Button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-on-surface-variant">No notifications</p>
        ) : (
          notifications.map((n) => (
            <a
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => !n.read && handleRead(n.id)}
              className={`block border-b border-outline-variant/5 px-4 py-3 transition-colors hover:bg-surface-container ${
                !n.read ? "bg-accent-cyan/5" : ""
              }`}
            >
              <p className="text-sm font-medium text-on-surface">{n.title}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
              <p className="mt-1 text-xs text-on-surface-variant/60">
                {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePassword } from "@/lib/actions/settings";

export function PasswordForm() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await updatePassword({ currentPassword, newPassword });
    if (res.success) {
      setMessage({ type: "success", text: t("passwordChanged") });
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setMessage({ type: "error", text: res.error === "Wrong password" ? t("wrongPassword") : t("error") });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">{t("currentPassword")}</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">{t("newPassword")}</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-error"}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? tc("loading") : t("changePassword")}
      </Button>
    </form>
  );
}

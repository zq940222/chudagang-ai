"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/settings";

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await updateProfile({ name });
    setMessage(res.success ? { type: "success", text: t("saved") } : { type: "error", text: t("error") });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">{t("name")}</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-500" : "text-error"}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? tc("loading") : tc("save")}
      </Button>
    </form>
  );
}

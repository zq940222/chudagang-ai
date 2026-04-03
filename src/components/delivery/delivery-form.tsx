"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitDeliverable } from "@/lib/actions/delivery";

export function DeliveryForm({ contractId }: { contractId: string }) {
  const t = useTranslations("delivery");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitDeliverable({
      contractId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      fileUrl: (formData.get("fileUrl") as string) || undefined,
    });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <p className="text-accent-cyan font-medium py-4">
            {t("submitted")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">{t("nameLabel")} *</label>
            <Input name="title" required placeholder={t("namePlaceholder")} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("descLabel")}</label>
            <textarea
              name="description"
              rows={4}
              placeholder={t("descPlaceholder")}
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("fileLabel")}</label>
            <Input name="fileUrl" type="url" placeholder={t("filePlaceholder")} className="mt-1" />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

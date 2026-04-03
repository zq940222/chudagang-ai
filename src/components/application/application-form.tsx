"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { applyToProject } from "@/lib/actions/application";

export function ApplicationForm({ projectId }: { projectId: string }) {
  const t = useTranslations("applicationForm");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await applyToProject({
      projectId,
      coverLetter: formData.get("coverLetter") as string || undefined,
      proposedRate: formData.get("proposedRate")
        ? Number(formData.get("proposedRate"))
        : undefined,
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
            <label className="text-sm font-medium text-on-surface">{t("coverLetter")}</label>
            <textarea
              name="coverLetter"
              rows={5}
              placeholder={t("coverLetterPlaceholder")}
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("proposedRate")}</label>
            <Input name="proposedRate" type="number" min={0} step={0.01} placeholder={t("ratePlaceholder")} className="mt-1" />
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

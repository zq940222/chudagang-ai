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

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError(t("fileRequired") || "File is required");
      return;
    }

    setLoading(true);
    setError(null);
    setUploading(true);
    setUploadProgress(10); // Start progress

    try {
      // 1. Get presigned URL
      const presignRes = await fetch(
        `/api/upload/presign?filename=${encodeURIComponent(
          file.name
        )}&contractId=${contractId}`
      );
      
      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { signedUrl, objectPath } = await presignRes.json();
      setUploadProgress(40);

      // 2. Upload file directly to Supabase
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }
      
      setUploadProgress(90);

      // 3. Submit form data with object path
      const formData = new FormData(e.currentTarget);
      const result = await submitDeliverable({
        contractId,
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || undefined,
        fileUrl: objectPath, // Store object path instead of actual URL
      });

      if (result.error) {
        setError(typeof result.error === "string" ? result.error : "Validation error");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(t("uploadError") || msg);
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
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
            <Input name="title" required placeholder={t("namePlaceholder")} className="mt-1" disabled={uploading || loading} />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">{t("descLabel")}</label>
            <textarea
              name="description"
              rows={4}
              placeholder={t("descPlaceholder")}
              disabled={uploading || loading}
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="fileUrl" className="text-sm font-medium text-on-surface">{t("fileLabel")} *</label>
            <Input
              id="fileUrl"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading || loading}
              className="mt-1"
              required
            />
            {uploading && (
              <div className="mt-2 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-cyan transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || uploading}>
            {loading || uploading ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

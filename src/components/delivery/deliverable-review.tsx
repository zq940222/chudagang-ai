"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { reviewDeliverable } from "@/lib/actions/delivery";
import { RevisionDialog } from "./revision-dialog";

interface Props {
  deliverableId: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  status: string;
}

export function DeliverableReview({ 
  contractId,
  deliverableId, 
  title, 
  description, 
  fileUrl, 
  status,
  isClient,
  locale = "en"
}: Props & { contractId: string, isClient?: boolean, locale?: string }) {
  const t = useTranslations("delivery");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleReview(action: "ACCEPTED" | "REJECTED") {
    setLoading(true);
    const comment = action === "REJECTED" ? prompt(t("rejectReason")) : undefined;
    await reviewDeliverable({
      deliverableId,
      status: action,
      reviewComment: comment ?? undefined,
    });
    setCurrentStatus(action);
    setLoading(false);
  }

  return (
    <div className="rounded-lg bg-surface-container-lowest p-3 ghost-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-on-surface text-sm">{title}</p>
          {description && <p className="mt-1 text-xs text-on-surface-variant">{description}</p>}
        </div>
        <span className="text-xs text-accent-cyan">{currentStatus}</span>
      </div>
      {fileUrl && (
        <a href={`/api/download?path=${encodeURIComponent(fileUrl)}&contractId=${contractId}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent-cyan underline">
          Download Attachment
        </a>
      )}
      {currentStatus === "SUBMITTED" && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => handleReview("ACCEPTED")} disabled={loading}>{t("accept")}</Button>
          <Button size="sm" variant="destructive" onClick={() => handleReview("REJECTED")} disabled={loading}>{t("reject")}</Button>
        </div>
      )}
      {isClient && status === "PENDING_REVIEW" && (
        <div className="mt-4 flex gap-3 border-t border-white/5 pt-4">
          <RevisionDialog contractId={contractId} locale={locale} />
        </div>
      )}
    </div>
  );
}

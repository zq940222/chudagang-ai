"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { reviewDeliverable } from "@/lib/actions/delivery";

interface Props {
  deliverableId: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  status: string;
}

export function DeliverableReview({ deliverableId, title, description, fileUrl, status }: Props) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleReview(action: "ACCEPTED" | "REJECTED") {
    setLoading(true);
    const comment = action === "REJECTED" ? prompt("Reason for rejection:") : undefined;
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
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent-cyan underline">
          View file
        </a>
      )}
      {currentStatus === "SUBMITTED" && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => handleReview("ACCEPTED")} disabled={loading}>Accept</Button>
          <Button size="sm" variant="destructive" onClick={() => handleReview("REJECTED")} disabled={loading}>Reject</Button>
        </div>
      )}
    </div>
  );
}

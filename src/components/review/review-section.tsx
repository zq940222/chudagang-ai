"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getContractReviews } from "@/lib/actions/review";
import { ReviewForm } from "./review-form";
import { ReviewCard, type ReviewCardData } from "./review-card";

type ReviewState = {
  submitted: boolean;
  revealed: boolean;
  reviews: ReviewCardData[];
};

export function ReviewSection({
  contractId,
  contractStatus,
  isClient,
}: {
  contractId: string;
  contractStatus: string;
  isClient: boolean;
}) {
  const t = useTranslations("review");
  const [state, setState] = useState<ReviewState | null>(null);
  const [loading, setLoading] = useState(contractStatus === "COMPLETED");

  useEffect(() => {
    if (contractStatus !== "COMPLETED") return;

    let cancelled = false;
    getContractReviews(contractId).then((result) => {
      if (cancelled) return;
      if (result.data) {
        setState(result.data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [contractId, contractStatus]);

  if (contractStatus !== "COMPLETED") return null;
  if (loading) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-black text-on-surface uppercase tracking-[0.15em]">
        {t("sectionTitle")}
      </h2>

      {state?.revealed ? (
        <div className="space-y-3">
          {state.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : state?.submitted ? (
        <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border text-center">
          <p className="text-sm text-on-surface-variant">
            {t("waitingReveal")}
          </p>
        </div>
      ) : (
        <ReviewForm contractId={contractId} isClient={isClient} />
      )}
    </div>
  );
}

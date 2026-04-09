"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitReview } from "@/lib/actions/review";
import {
  CLIENT_TO_DEVELOPER_TAGS,
  DEVELOPER_TO_CLIENT_TAGS,
} from "@/lib/review-tags";

const TAG_I18N_MAP: Record<string, string> = {
  code_quality: "tagCodeQuality",
  good_communication: "tagGoodCommunication",
  on_time_delivery: "tagOnTimeDelivery",
  exceeded_expectations: "tagExceededExpectations",
  fast_response: "tagFastResponse",
  clear_requirements: "tagClearRequirements",
  good_collaboration: "tagGoodCollaboration",
  timely_payment: "tagTimelyPayment",
  respects_expertise: "tagRespectsExpertise",
  prompt_feedback: "tagPromptFeedback",
};

const STAR_LABELS = ["star1", "star2", "star3", "star4", "star5"] as const;

export function ReviewForm({
  contractId,
  isClient,
}: {
  contractId: string;
  isClient: boolean;
}) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const tags = isClient
    ? CLIENT_TO_DEVELOPER_TAGS
    : DEVELOPER_TO_CLIENT_TAGS;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev
    );
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    setError("");

    const result = await submitReview({
      contractId,
      rating,
      tags: selectedTags,
      comment: comment.trim() || undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-accent-cyan/10 p-6 text-center">
        <p className="text-sm font-medium text-accent-cyan">{t("submitted")}</p>
      </div>
    );
  }

  const displayStar = hoveredStar || rating;

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 ghost-border space-y-6">
      <h3 className="text-sm font-black text-on-surface uppercase tracking-[0.15em]">
        {t("submitTitle")}
      </h3>

      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("ratingLabel")}
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= displayStar
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-on-surface-variant/20 fill-on-surface-variant/20"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {displayStar > 0 && (
            <span className="ml-2 text-sm font-medium text-on-surface-variant">
              {t(STAR_LABELS[displayStar - 1])}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("tagsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-accent-cyan text-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t(TAG_I18N_MAP[tag])}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {t("commentLabel")}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-xl bg-surface-container p-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
        />
        <p className="text-right text-xs text-on-surface-variant/50">
          {comment.length}/500
        </p>
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-primary text-on-primary hover:bg-primary/90 h-12 rounded-xl font-bold"
      >
        {submitting ? t("submitting") : t("submitButton")}
      </Button>
    </div>
  );
}

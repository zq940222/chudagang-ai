"use client";

import { useTranslations } from "next-intl";

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

export type ReviewCardData = {
  id: string;
  reviewerRole?: string;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  rating: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
};

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const t = useTranslations("review");

  const initial = review.reviewerName?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-5 ghost-border space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {review.reviewerAvatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={review.reviewerAvatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface truncate">
            {review.reviewerName ?? "Anonymous"}
          </p>
          <p className="text-xs text-on-surface-variant">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-on-surface-variant/20 fill-on-surface-variant/20"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-accent-cyan/10 px-3 py-1 text-xs font-bold text-accent-cyan"
            >
              {TAG_I18N_MAP[tag] ? t(TAG_I18N_MAP[tag]) : tag}
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}

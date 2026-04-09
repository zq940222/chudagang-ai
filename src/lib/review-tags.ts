export const CLIENT_TO_DEVELOPER_TAGS = [
  "code_quality",
  "good_communication",
  "on_time_delivery",
  "exceeded_expectations",
  "fast_response",
] as const;

export const DEVELOPER_TO_CLIENT_TAGS = [
  "clear_requirements",
  "good_collaboration",
  "timely_payment",
  "respects_expertise",
  "prompt_feedback",
] as const;

export type ClientTag = (typeof CLIENT_TO_DEVELOPER_TAGS)[number];
export type DeveloperTag = (typeof DEVELOPER_TO_CLIENT_TAGS)[number];
export type ReviewTag = ClientTag | DeveloperTag;

export const ALL_REVIEW_TAGS = [
  ...CLIENT_TO_DEVELOPER_TAGS,
  ...DEVELOPER_TO_CLIENT_TAGS,
] as const;

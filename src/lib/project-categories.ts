export type ProjectCategoryOption = {
  value: string;
  labelKey: string;
  aliases: string[];
};

export const projectCategoryOptions: ProjectCategoryOption[] = [
  { value: "llm", labelKey: "categories.llm", aliases: ["llm", "prompt", "fine-tuning", "fine_tuning"] },
  { value: "rag", labelKey: "categories.rag", aliases: ["rag", "knowledge-base", "knowledge_base"] },
  { value: "vision", labelKey: "categories.vision", aliases: ["vision", "cv", "computer-vision", "computer_vision"] },
  { value: "multimodal", labelKey: "categories.multimodal", aliases: ["multimodal", "omni", "multi-modal", "multi_modal"] },
  { value: "audio", labelKey: "categories.audio", aliases: ["audio", "speech", "voice"] },
  { value: "agent", labelKey: "categories.agent", aliases: ["agent", "workflow", "assistant"] },
  { value: "deployment", labelKey: "categories.deployment", aliases: ["deployment", "deploy", "mlops"] },
  { value: "automation", labelKey: "categories.automation", aliases: ["automation", "integration", "integrations"] },
  { value: "data", labelKey: "categories.data", aliases: ["data", "analytics", "bi"] },
  { value: "evaluation", labelKey: "categories.evaluation", aliases: ["evaluation", "benchmark", "testing"] },
  { value: "product", labelKey: "categories.product", aliases: ["product", "app", "saas"] },
  { value: "neural", labelKey: "categories.neural", aliases: ["neural", "architecture", "model"] },
  { value: "other", labelKey: "categories.other", aliases: ["other", "misc", "custom"] },
];

const categoryLookup = new Map(
  projectCategoryOptions.flatMap((option) =>
    [option.value, ...option.aliases].map((alias) => [alias, option] as const)
  )
);

export function normalizeProjectCategory(category?: string | null) {
  return category?.trim().toLowerCase() || "";
}

export function resolveProjectCategory(category?: string | null) {
  const normalized = normalizeProjectCategory(category);
  if (!normalized) return null;
  return categoryLookup.get(normalized) ?? null;
}

export function getProjectCategoryFilterValues(category: string) {
  const option = resolveProjectCategory(category);
  if (!option) return [normalizeProjectCategory(category)];
  return [option.value, ...option.aliases.filter((alias) => alias !== option.value)];
}

export function getProjectCategoryLabel(
  category: string | null | undefined,
  t: (key: string) => string
) {
  const option = resolveProjectCategory(category);
  return option ? t(option.labelKey) : category?.trim() || null;
}

export type DeveloperCategoryOption = {
  value: string;
  storedValue: string;
  labelKey: string;
  aliases: string[];
};

export const developerCategoryOptions: DeveloperCategoryOption[] = [
  { value: "ai", storedValue: "AI", labelKey: "categories.ai", aliases: ["ai", "ml", "machine-learning", "artificial-intelligence"] },
  { value: "language", storedValue: "Language", labelKey: "categories.language", aliases: ["language", "programming-language", "coding"] },
  { value: "framework", storedValue: "Framework", labelKey: "categories.framework", aliases: ["framework", "web-framework"] },
  { value: "frontend", storedValue: "Frontend", labelKey: "categories.frontend", aliases: ["frontend", "ui", "web"] },
  { value: "devops", storedValue: "DevOps", labelKey: "categories.devops", aliases: ["devops", "deployment", "mlops"] },
  { value: "cloud", storedValue: "Cloud", labelKey: "categories.cloud", aliases: ["cloud", "aws", "gcp", "azure"] },
  { value: "database", storedValue: "Database", labelKey: "categories.database", aliases: ["database", "data", "storage"] },
  { value: "api", storedValue: "API", labelKey: "categories.api", aliases: ["api", "backend", "integration"] },
  { value: "other", storedValue: "Other", labelKey: "categories.other", aliases: ["other", "misc"] },
];

const developerCategoryLookup = new Map(
  developerCategoryOptions.flatMap((option) =>
    [option.value, option.storedValue, ...option.aliases].map((alias) => [alias.toLowerCase(), option] as const)
  )
);

export function normalizeDeveloperCategory(category?: string | null) {
  return category?.trim().toLowerCase() || "";
}

export function resolveDeveloperCategory(category?: string | null) {
  const normalized = normalizeDeveloperCategory(category);
  if (!normalized) return null;
  return developerCategoryLookup.get(normalized) ?? null;
}

export function getDeveloperCategoryFilterValues(category: string) {
  const option = resolveDeveloperCategory(category);
  if (!option) return [normalizeDeveloperCategory(category)];
  return [option.storedValue];
}

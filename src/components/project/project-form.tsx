"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkillSelector } from "@/components/developer/skill-selector";
import { createProject } from "@/lib/actions/project";
import { projectCategoryOptions } from "@/lib/project-categories";

type Skill = {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
};

interface ProjectFormProps {
  skills: Skill[];
}

export function ProjectForm({ skills }: ProjectFormProps) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currency, setCurrency] = useState("CNY");
  const [customCurrency, setCustomCurrency] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (currency === "CUSTOM") {
      formData.set("currency", customCurrency.trim().toUpperCase());
    }
    const result = await createProject(formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push("/dashboard/client/projects");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-on-surface">
          Title
        </label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Project title"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-on-surface">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          placeholder="Describe your project requirements in detail..."
          className="flex w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="budget" className="text-sm font-medium text-on-surface">
            Budget
          </label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min={0}
            placeholder="e.g. 5000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium text-on-surface">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex h-10 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
          >
            <option value="CNY">CNY (¥)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {currency === "CUSTOM" && (
        <div className="space-y-2">
          <label htmlFor="customCurrency" className="text-sm font-medium text-on-surface">
            Settlement Unit
          </label>
          <Input
            id="customCurrency"
            name="customCurrency"
            value={customCurrency}
            onChange={(e) => setCustomCurrency(e.target.value)}
            required
            placeholder="e.g. HKD, JPY, USDT"
            maxLength={12}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-on-surface">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue=""
          className="flex h-10 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
        >
          <option value="">{t("categoryPlaceholder")}</option>
          {projectCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-on-surface">Skills</label>
        <SkillSelector
          skills={skills}
          selected={selectedSkills}
          onChange={setSelectedSkills}
          name="skillTagIds"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}

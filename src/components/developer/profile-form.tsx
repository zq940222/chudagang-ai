"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createProfile, updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkillSelector } from "@/components/developer/skill-selector";

type SkillTag = {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
};

export type InitialData = {
  displayName: string;
  title?: string | null;
  bio?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  hourlyRate?: number | null;
  currency?: string;
  skills?: { skillTagId: string }[];
};

interface ProfileFormProps {
  skillTags: SkillTag[];
  initialData?: InitialData | null;
  mode: "create" | "edit";
}

export function ProfileForm({ skillTags, initialData, mode }: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("profileForm");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    initialData?.skills?.map((s) => s.skillTagId) ?? []
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const action = mode === "create" ? createProfile : updateProfile;
      const result = await action(formData);
      if (result.success) {
        router.push("/dashboard/developer");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const labelClass = "text-sm font-medium text-on-surface";
  const textareaClass =
    "flex w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 disabled:cursor-not-allowed disabled:opacity-50";
  const selectClass =
    "flex h-10 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </h1>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error ghost-border">
            {error}
          </div>
        )}

        {/* Main grid: 2-col info + 1-col sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left 2 cols */}
          <div className="space-y-6 lg:col-span-2">

            {/* Basic info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sectionBasic")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="displayName" className={labelClass}>
                      {t("displayName")} {t("displayNameRequired")}
                    </label>
                    <Input
                      id="displayName"
                      name="displayName"
                      required
                      minLength={2}
                      maxLength={100}
                      defaultValue={initialData?.displayName ?? ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="title" className={labelClass}>
                      {t("title")}
                    </label>
                    <Input
                      id="title"
                      name="title"
                      maxLength={200}
                      placeholder={t("titlePlaceholder")}
                      defaultValue={initialData?.title ?? ""}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="bio" className={labelClass}>
                    {t("bio")}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={5}
                    maxLength={2000}
                    placeholder={t("bioPlaceholder")}
                    defaultValue={initialData?.bio ?? ""}
                    className={textareaClass}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Links card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sectionLinks")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="githubUrl" className={labelClass}>
                    {t("githubUrl")}
                  </label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    placeholder={t("githubPlaceholder")}
                    defaultValue={initialData?.githubUrl ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="portfolioUrl" className={labelClass}>
                    {t("portfolioUrl")}
                  </label>
                  <Input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    type="url"
                    placeholder={t("portfolioPlaceholder")}
                    defaultValue={initialData?.portfolioUrl ?? ""}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right col: rate + save */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("sectionRate")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="hourlyRate" className={labelClass}>
                    {t("hourlyRate")}
                  </label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min={0}
                    max={10000}
                    step={0.01}
                    placeholder="200"
                    defaultValue={initialData?.hourlyRate ?? ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="currency" className={labelClass}>
                    {t("currency")}
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={initialData?.currency ?? "CNY"}
                    className={selectClass}
                  >
                    <option value="CNY">CNY (&yen;)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (&euro;)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={pending} className="w-full">
              {pending
                ? t("saving")
                : mode === "create"
                  ? t("createSubmit")
                  : t("editSubmit")}
            </Button>
          </div>
        </div>

        {/* Skills — full width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("skills")} {t("skillsRequired")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkillSelector
              skills={skillTags}
              selected={selectedSkills}
              onChange={setSelectedSkills}
              name="skillTagIds"
            />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
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

type InitialData = {
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
  initialData?: InitialData;
  mode: "create" | "edit";
}

export function ProfileForm({ skillTags, initialData, mode }: ProfileFormProps) {
  const router = useRouter();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Create Developer Profile" : "Edit Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-error/10 px-4 py-2 text-sm text-error">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-sm font-medium text-on-surface">
              Display Name *
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

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-on-surface">
              Title
            </label>
            <Input
              id="title"
              name="title"
              maxLength={200}
              placeholder="e.g. Full-Stack Developer"
              defaultValue={initialData?.title ?? ""}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-on-surface">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={2000}
              placeholder="Tell clients about yourself..."
              defaultValue={initialData?.bio ?? ""}
              className="flex w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* GitHub URL */}
          <div className="space-y-1.5">
            <label htmlFor="githubUrl" className="text-sm font-medium text-on-surface">
              GitHub URL
            </label>
            <Input
              id="githubUrl"
              name="githubUrl"
              type="url"
              placeholder="https://github.com/username"
              defaultValue={initialData?.githubUrl ?? ""}
            />
          </div>

          {/* Portfolio URL */}
          <div className="space-y-1.5">
            <label htmlFor="portfolioUrl" className="text-sm font-medium text-on-surface">
              Portfolio URL
            </label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              placeholder="https://yourportfolio.com"
              defaultValue={initialData?.portfolioUrl ?? ""}
            />
          </div>

          {/* Hourly Rate + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="hourlyRate" className="text-sm font-medium text-on-surface">
                Hourly Rate
              </label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min={0}
                max={1000}
                step={0.01}
                placeholder="50"
                defaultValue={initialData?.hourlyRate ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="currency" className="text-sm font-medium text-on-surface">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue={initialData?.currency ?? "CNY"}
                className="flex h-10 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:bg-surface-container-high focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              >
                <option value="CNY">CNY (&yen;)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (&euro;)</option>
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface">
              Skills *
            </label>
            <SkillSelector
              skills={skillTags}
              selected={selectedSkills}
              onChange={setSelectedSkills}
              name="skillTagIds"
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={pending} className="w-full">
            {pending
              ? "Saving..."
              : mode === "create"
                ? "Create Profile"
                : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

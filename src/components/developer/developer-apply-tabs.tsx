"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ProfileForm } from "@/components/developer/profile-form";
import { DeveloperApplyChat } from "@/components/developer/developer-apply-chat";

type SkillTag = {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
};

interface DeveloperApplyTabsProps {
  skillTags: SkillTag[];
}

export function DeveloperApplyTabs({ skillTags }: DeveloperApplyTabsProps) {
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"chat" | "form">("chat");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === "chat"
              ? "bg-gradient-to-r from-primary to-accent-cyan text-on-primary shadow-lg shadow-primary/20"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant ghost-border"
          }`}
        >
          {locale === "zh" ? "AI 对话辅助" : "AI Chat Assist"}
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === "form"
              ? "bg-gradient-to-r from-primary to-accent-cyan text-on-primary shadow-lg shadow-primary/20"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant ghost-border"
          }`}
        >
          {locale === "zh" ? "手动填写表单" : "Fill Form Manually"}
        </button>
      </div>

      {/* Content */}
      {activeTab === "chat" ? (
        <div className="h-[480px] rounded-2xl glass ghost-border overflow-hidden shadow-2xl shadow-primary/5">
          <DeveloperApplyChat />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <ProfileForm skillTags={skillTags} mode="create" />
        </div>
      )}
    </div>
  );
}

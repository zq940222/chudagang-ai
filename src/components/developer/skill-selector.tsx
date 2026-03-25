"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Skill = {
  id: string;
  name: string;
  category: string;
  localeZh: string;
  localeEn: string;
};

interface SkillSelectorProps {
  skills: Skill[];
  selected: string[];
  onChange: (ids: string[]) => void;
  name: string;
}

export function SkillSelector({ skills, selected, onChange, name }: SkillSelectorProps) {
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const filtered = skills.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.localeZh.includes(search) ||
        s.localeEn.toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, Skill[]>();
    for (const skill of filtered) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return map;
  }, [skills, search]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="max-h-64 space-y-4 overflow-y-auto rounded-md bg-surface-container-lowest p-3 ghost-border">
        {grouped.size === 0 && (
          <p className="text-sm text-on-surface-variant/60">No skills found</p>
        )}
        {[...grouped.entries()].map(([category, categorySkills]) => (
          <div key={category}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
              {category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categorySkills.map((skill) => {
                const isSelected = selected.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggle(skill.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    )}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden inputs for form submission */}
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}

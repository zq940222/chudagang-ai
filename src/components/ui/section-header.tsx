import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  tagline?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  tagline,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      {tagline && (
        <span className="mb-3 inline-block text-[10px] font-black uppercase tracking-[0.25em] text-accent-cyan">
          {tagline}
        </span>
      )}
      <h2 className="text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-on-surface-variant leading-relaxed",
            align === "center" ? "mx-auto max-w-2xl" : "max-w-md"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

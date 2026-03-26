import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-surface-container-lowest p-6 ghost-border transition-all hover:bg-surface-container hover:-translate-y-0.5">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-accent-cyan blur-xl" />
      </div>
      
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{title}</p>
      <p className="mt-2 text-3xl font-black text-on-surface tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-2 text-xs text-on-surface-variant/60 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

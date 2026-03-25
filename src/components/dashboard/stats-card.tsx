import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card>
      <p className="text-sm text-on-surface-variant">{title}</p>
      <p className="mt-1 text-2xl font-bold text-on-surface">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-on-surface-variant/70">{subtitle}</p>
      )}
    </Card>
  );
}

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({
  value,
  max = 100,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-container",
        className
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-accent-cyan transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

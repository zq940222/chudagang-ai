import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-container text-on-surface-variant",
        accent: "bg-accent-cyan/10 text-accent-cyan",
        outline: "border border-outline-variant/30 text-on-surface-variant",
        status: "bg-secondary/10 text-secondary",
        dark: "bg-primary-container text-on-primary-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

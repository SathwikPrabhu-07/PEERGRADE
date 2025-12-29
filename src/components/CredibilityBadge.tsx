import { Shield, ShieldCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredibilityBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getCredibilityLevel = (score: number) => {
  if (score >= 80) return { label: "Expert", icon: Award, color: "text-primary" };
  if (score >= 50) return { label: "Trusted", icon: ShieldCheck, color: "text-success" };
  return { label: "Rising", icon: Shield, color: "text-secondary" };
};

const sizeClasses = {
  sm: { icon: "h-4 w-4", text: "text-xs", padding: "px-2 py-1" },
  md: { icon: "h-5 w-5", text: "text-sm", padding: "px-3 py-1.5" },
  lg: { icon: "h-6 w-6", text: "text-base", padding: "px-4 py-2" },
};

export function CredibilityBadge({
  score,
  showLabel = true,
  size = "md",
  className,
}: CredibilityBadgeProps) {
  const { label, icon: Icon, color } = getCredibilityLevel(score);
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted",
        sizes.padding,
        className
      )}
    >
      <Icon className={cn(sizes.icon, color)} />
      <span className={cn("font-semibold", sizes.text, color)}>{score}</span>
      {showLabel && (
        <span className={cn("text-muted-foreground", sizes.text)}>{label}</span>
      )}
    </div>
  );
}

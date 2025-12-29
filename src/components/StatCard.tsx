import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "gradient";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md",
        variant === "gradient" && "gradient-primary text-primary-foreground",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "text-sm font-medium mb-1",
                variant === "gradient"
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              {title}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p
                className={cn(
                  "text-sm mt-1",
                  variant === "gradient"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {description}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-sm mt-1 font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}
              >
                {trend.positive ? "+" : "-"}{trend.value}% from last month
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl",
              variant === "gradient"
                ? "bg-primary-foreground/20"
                : "bg-primary/10"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                variant === "gradient" ? "text-primary-foreground" : "text-primary"
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "unverified";
  className?: string;
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  if (status === "verified") {
    return (
      <Badge
        className={cn(
          "bg-success/10 text-success hover:bg-success/20 border-0",
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-warning/10 text-warning hover:bg-warning/20 border-0",
          className
        )}
      >
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  }

  return null;
}

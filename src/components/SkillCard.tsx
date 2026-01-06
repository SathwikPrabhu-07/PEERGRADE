import { Edit2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { cn } from "@/lib/utils";

interface SkillCardProps {
  skill: {
    id: string;
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    category: string;
    rating?: number;
    verificationStatus?: "verified" | "pending" | "unverified";
  };
  stats?: {
    score: number;
    sessions: number;
    assignments?: number;
  };
  type: "teach" | "learn";
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

const levelColors = {
  Beginner: "bg-secondary/10 text-secondary",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-accent/10 text-accent",
};

export function SkillCard({
  skill,
  stats,
  type,
  onEdit,
  onRemove,
  className,
}: SkillCardProps) {
  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {skill.name}
              </h3>
              {skill.verificationStatus && (
                <VerificationBadge status={skill.verificationStatus} />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="text-xs">
                {skill.category}
              </Badge>
              <Badge className={cn("text-xs border-0", levelColors[skill.level])}>
                {skill.level}
              </Badge>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              {stats && (
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md w-fit">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-foreground">Score:</span>
                    <span className={cn(
                      "text-sm font-bold",
                      stats.score >= 80 ? "text-green-600" :
                        stats.score >= 60 ? "text-blue-600" : "text-muted-foreground"
                    )}>
                      {stats.score}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">|</span>
                  <span className="text-xs text-muted-foreground">{stats.sessions} sessions</span>
                </div>
              )}

              {/* Legacy rating display, keep if no stats or just always show for teach */}
              {type === "teach" && skill.rating !== undefined && !stats && (
                <div className="flex items-center gap-2">
                  <RatingStars rating={skill.rating} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({skill.rating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {type === "teach" && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

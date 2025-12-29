import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/RatingStars";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    skill: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    rating: number;
    credibilityScore: number;
  };
  onRequestSession?: () => void;
  className?: string;
}

const levelColors = {
  Beginner: "bg-secondary/10 text-secondary",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-accent/10 text-accent",
};

export function UserCard({ user, onRequestSession, className }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-all duration-300 overflow-hidden",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-1">
              {user.name}
            </h3>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-sm text-muted-foreground">{user.skill}</span>
              <Badge className={cn("text-xs border-0", levelColors[user.level])}>
                {user.level}
              </Badge>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <RatingStars rating={user.rating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {user.rating.toFixed(1)}
                </span>
              </div>
              <CredibilityBadge score={user.credibilityScore} size="sm" />
            </div>
          </div>
        </div>

        <Button
          onClick={onRequestSession}
          className="w-full mt-4 gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Request Session
        </Button>
      </CardContent>
    </Card>
  );
}

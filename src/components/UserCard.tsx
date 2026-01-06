import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/RatingStars";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { cn } from "@/lib/utils";

// Skill type for the skills array
export interface SkillInfo {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  rating?: number;
}

interface UserCardProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    skills: SkillInfo[];
    credibilityScore: number;
  };
  selectedCategory?: string; // For filtering highlight
  onSkillClick?: (skill: SkillInfo) => void;
  className?: string;
}

const levelColors = {
  Beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200",
  Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  Advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
};

const greyStyle = "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 opacity-60";

export function UserCard({ user, selectedCategory, onSkillClick, className }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Calculate average rating across all skills
  const avgRating = user.skills.length > 0
    ? user.skills.reduce((sum, s) => sum + (s.rating || 0), 0) / user.skills.length
    : 0;

  // Check if skill matches selected category
  const isSkillHighlighted = (skill: SkillInfo) => {
    if (!selectedCategory || selectedCategory === "All") return true;
    return skill.category === selectedCategory;
  };

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

            {/* ALL SKILLS - clickable chips with category highlighting */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {user.skills.map((skill) => {
                const highlighted = isSkillHighlighted(skill);
                return (
                  <Badge
                    key={skill.id}
                    className={cn(
                      "text-xs border cursor-pointer transition-all hover:scale-105",
                      highlighted ? levelColors[skill.level] : greyStyle
                    )}
                    onClick={() => onSkillClick?.(skill)}
                    title={`Click to request: ${skill.name} (${skill.level})`}
                  >
                    {skill.name}
                  </Badge>
                );
              })}
              {user.skills.length === 0 && (
                <span className="text-sm text-muted-foreground">No skills</span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <RatingStars rating={avgRating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <CredibilityBadge score={user.credibilityScore} size="sm" />
            </div>
          </div>
        </div>

        {/* Hint text */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Click a skill to request a session
        </p>
      </CardContent>
    </Card>
  );
}

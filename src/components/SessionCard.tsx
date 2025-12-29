import { Calendar, Clock, Video, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: {
    id: string;
    skill: string;
    teacher: { name: string; avatar?: string };
    learner: { name: string; avatar?: string };
    dateTime: string;
    status: "upcoming" | "completed" | "in-progress";
  };
  userRole: "teacher" | "learner";
  onJoin?: () => void;
  onFeedback?: () => void;
  className?: string;
}

const statusColors = {
  upcoming: "bg-secondary/10 text-secondary",
  completed: "bg-success/10 text-success",
  "in-progress": "bg-primary/10 text-primary",
};

const statusLabels = {
  upcoming: "Upcoming",
  completed: "Completed",
  "in-progress": "In Progress",
};

export function SessionCard({
  session,
  userRole,
  onJoin,
  onFeedback,
  className,
}: SessionCardProps) {
  const otherParty = userRole === "teacher" ? session.learner : session.teacher;
  const roleLabel = userRole === "teacher" ? "Teaching" : "Learning from";

  const initials = otherParty.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParty.avatar} alt={otherParty.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate mb-1">
                {session.skill}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {roleLabel} <span className="font-medium">{otherParty.name}</span>
              </p>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(session.dateTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(session.dateTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("border-0", statusColors[session.status])}>
              {statusLabels[session.status]}
            </Badge>

            {session.status === "upcoming" && onJoin && (
              <Button size="sm" onClick={onJoin} className="gap-1">
                <Video className="h-4 w-4" />
                Join
              </Button>
            )}

            {session.status === "completed" && onFeedback && (
              <Button
                size="sm"
                variant="outline"
                onClick={onFeedback}
                className="gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

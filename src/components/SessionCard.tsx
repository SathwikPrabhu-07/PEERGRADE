import { Calendar, Clock, Video, MessageSquare, ClockIcon, PhoneOff } from "lucide-react";
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
    status: "scheduled" | "ongoing" | "completed" | "cancelled";
  };
  userRole: "teacher" | "learner";
  canJoin?: boolean;
  needsScheduling?: boolean;
  isOngoing?: boolean;
  onJoin?: () => void;
  onSetTime?: () => void;
  onEndSession?: () => void;
  onFeedback?: () => void;
  className?: string;
}

const statusColors = {
  scheduled: "bg-secondary/10 text-secondary",
  ongoing: "bg-green-500/10 text-green-600",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  scheduled: "Scheduled",
  ongoing: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function SessionCard({
  session,
  userRole,
  canJoin = false,
  needsScheduling = false,
  isOngoing = false,
  onJoin,
  onSetTime,
  onEndSession,
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

  const hasValidDate = session.dateTime && session.dateTime.length > 0;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-300",
        isOngoing && "border-green-500/50 bg-green-50/30",
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
                {hasValidDate ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Time not set</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("border-0", statusColors[session.status])}>
              {statusLabels[session.status]}
            </Badge>

            {/* Teacher needs to set time */}
            {session.status === "scheduled" && needsScheduling && onSetTime && (
              <Button size="sm" onClick={onSetTime} className="gap-1" variant="outline">
                <ClockIcon className="h-4 w-4" />
                Set Time
              </Button>
            )}

            {/* Join button - for scheduled sessions (enabled only when canJoin is true) */}
            {session.status === "scheduled" && !needsScheduling && hasValidDate && onJoin && (
              <Button
                size="sm"
                onClick={onJoin}
                className="gap-1"
                disabled={!canJoin}
                title={!canJoin ? "Session will be available at scheduled time" : "Click to join the video meeting"}
              >
                <Video className="h-4 w-4" />
                {canJoin ? "Join Session" : "Waiting..."}
              </Button>
            )}

            {/* Ongoing session - show both Join and End Session buttons */}
            {session.status === "ongoing" && (
              <div className="flex flex-col gap-2">
                {onJoin && (
                  <Button
                    size="sm"
                    onClick={onJoin}
                    className="gap-1"
                    title="Rejoin the video meeting"
                  >
                    <Video className="h-4 w-4" />
                    Rejoin
                  </Button>
                )}
                {onEndSession && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onEndSession}
                    className="gap-1"
                    title="End this session"
                  >
                    <PhoneOff className="h-4 w-4" />
                    End Session
                  </Button>
                )}
              </div>
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

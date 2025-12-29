import { Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: {
    id: string;
    user: { name: string; avatar?: string };
    skill: string;
    message: string;
    timestamp: string;
  };
  type: "incoming" | "outgoing";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function RequestCard({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  className,
}: RequestCardProps) {
  const initials = request.user.name
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
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={request.user.avatar} alt={request.user.name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {request.user.name}
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(request.timestamp).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Wants to learn <span className="font-medium text-foreground">{request.skill}</span>
            </p>

            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">
              "{request.message}"
            </p>

            <div className="flex items-center gap-2">
              {type === "incoming" && (
                <>
                  <Button
                    size="sm"
                    onClick={onAccept}
                    className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReject}
                    className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {type === "outgoing" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

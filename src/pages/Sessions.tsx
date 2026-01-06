import { useState, useEffect, useCallback } from "react";
import { Calendar, Loader2, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SessionCard } from "@/components/SessionCard";
import { FeedbackModal } from "@/components/FeedbackModal";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSessions,
  scheduleSession as scheduleSessionApi,
  joinSession as joinSessionApi,
  completeSession as completeSessionApi,
  submitSessionFeedback,
  Session
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    session: Session | null;
  }>({ open: false, session: null });
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean;
    session: Session | null;
    dateTime: string;
  }>({ open: false, session: null, dateTime: "" });
  const { toast } = useToast();

  // Fetch sessions from backend
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('[Sessions] Fetching sessions for user:', user.id);
      const response = await getSessions(user.id);
      setSessions(response.data.all);
      console.log('[Sessions] Fetched:', response.data.all.length);
    } catch (error) {
      console.error('[Sessions] Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Active sessions include both 'scheduled' and 'ongoing' status
  const activeSessions = sessions.filter((s) => s.status === "scheduled" || s.status === "ongoing");
  const ongoingSessions = sessions.filter((s) => s.status === "ongoing");
  const scheduledSessions = sessions.filter((s) => s.status === "scheduled");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const getUserRole = (session: Session): "teacher" | "learner" => {
    return session.teacherId === user?.id ? "teacher" : "learner";
  };

  const canJoin = (session: Session): boolean => {
    if (!session.scheduledAt) return false;
    const scheduledTime = new Date(session.scheduledAt);
    return new Date() >= scheduledTime;
  };

  const handleSetTime = (session: Session) => {
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);

    setScheduleModal({ open: true, session, dateTime: defaultDateTime });
  };

  const handleScheduleSubmit = async () => {
    if (!user?.id || !scheduleModal.session || !scheduleModal.dateTime) return;

    try {
      await scheduleSessionApi(user.id, scheduleModal.session.id, scheduleModal.dateTime);

      // Update local state
      setSessions(sessions.map(s =>
        s.id === scheduleModal.session!.id
          ? { ...s, scheduledAt: scheduleModal.dateTime }
          : s
      ));

      toast({
        title: "Session scheduled!",
        description: `Session time set for ${new Date(scheduleModal.dateTime).toLocaleString()}`,
      });

      setScheduleModal({ open: false, session: null, dateTime: "" });
    } catch (error) {
      console.error('[Sessions] Error scheduling session:', error);
      toast({
        title: "Error",
        description: "Failed to schedule session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoin = async (session: Session) => {
    if (!user?.id) return;

    if (!canJoin(session)) {
      toast({
        title: "Cannot join yet",
        description: `Session starts at ${new Date(session.scheduledAt!).toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await joinSessionApi(user.id, session.id);

      // Update local state with the updated session (now 'ongoing')
      if (response.data.session) {
        setSessions(sessions.map(s =>
          s.id === session.id ? { ...s, ...response.data.session } : s
        ));
      }

      // Open Jitsi meeting in new tab
      const meetingUrl = response.data.meetingUrl;
      if (meetingUrl) {
        window.open(meetingUrl, "_blank", "noopener,noreferrer");
        toast({
          title: "Joining Session",
          description: "Opening Jitsi meeting in a new tab...",
        });
      } else {
        toast({
          title: "Meeting link not ready",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Sessions] Error joining session:', error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async (session: Session) => {
    if (!user?.id) return;

    try {
      const response = await completeSessionApi(user.id, session.id);

      // Update local state - move session to completed
      setSessions(sessions.map(s =>
        s.id === session.id ? response.data : s
      ));

      toast({
        title: "Session completed",
        description: "The session has been marked as completed.",
      });
    } catch (error) {
      console.error('[Sessions] Error completing session:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenFeedback = (session: Session) => {
    setFeedbackModal({ open: true, session });
  };

  const handleSubmitFeedback = async (rating: number, comment: string) => {
    if (!user?.id || !feedbackModal.session) return;

    try {
      await submitSessionFeedback(user.id, feedbackModal.session.id, rating, comment);
      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback.",
      });
      // The FeedbackModal handles closing itself after success animation
    } catch (error: unknown) {
      console.error('[Sessions] Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle 409 conflict (already submitted)
      if (errorMessage.includes('already submitted') || errorMessage.includes('409')) {
        toast({
          title: "Already submitted",
          description: "You have already submitted feedback for this session.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your learning sessions
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              Active
              {activeSessions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {activeSessions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              Completed
              {completedSessions.length > 0 && (
                <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {completedSessions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeSessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No active sessions"
                description="When you accept a session request, it will appear here."
              />
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {activeSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={{
                      ...session,
                      skill: session.skillName,
                      teacher: { name: session.teacherName, avatar: '' },
                      learner: { name: session.learnerName, avatar: '' },
                      dateTime: session.scheduledAt || '',
                      status: session.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
                    }}
                    userRole={getUserRole(session)}
                    canJoin={canJoin(session)}
                    needsScheduling={!session.scheduledAt && getUserRole(session) === 'teacher'}
                    isOngoing={session.status === 'ongoing'}
                    onJoin={() => handleJoin(session)}
                    onSetTime={() => handleSetTime(session)}
                    onEndSession={() => handleEndSession(session)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedSessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No completed sessions"
                description="Your completed sessions will appear here."
              />
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {completedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={{
                      ...session,
                      skill: session.skillName,
                      teacher: { name: session.teacherName, avatar: '' },
                      learner: { name: session.learnerName, avatar: '' },
                      dateTime: session.scheduledAt || session.completedAt || '',
                      status: 'completed',
                    }}
                    userRole={getUserRole(session)}
                    onFeedback={() => handleOpenFeedback(session)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Modal */}
      <Dialog open={scheduleModal.open} onOpenChange={(open) => setScheduleModal({ ...scheduleModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dateTime">Select Date & Time</Label>
              <Input
                id="dateTime"
                type="datetime-local"
                value={scheduleModal.dateTime}
                onChange={(e) => setScheduleModal({ ...scheduleModal, dateTime: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModal({ open: false, session: null, dateTime: "" })}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit}>
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      {feedbackModal.session && (
        <FeedbackModal
          open={feedbackModal.open}
          onOpenChange={(open) => setFeedbackModal({ ...feedbackModal, open })}
          sessionDetails={{
            skill: feedbackModal.session.skillName,
            partnerName:
              feedbackModal.session.teacherId === user?.id
                ? feedbackModal.session.learnerName
                : feedbackModal.session.teacherName,
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </DashboardLayout>
  );
}

import { useState } from "react";
import { Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SessionCard } from "@/components/SessionCard";
import { FeedbackModal } from "@/components/FeedbackModal";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialSessions = [
  {
    id: "1",
    skill: "Python Programming",
    teacher: { name: "Alex Chen", avatar: "" },
    learner: { name: "You", avatar: "" },
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    status: "upcoming" as const,
  },
  {
    id: "2",
    skill: "UI/UX Design",
    teacher: { name: "You", avatar: "" },
    learner: { name: "Sarah Miller", avatar: "" },
    dateTime: new Date(Date.now() + 172800000).toISOString(),
    status: "upcoming" as const,
  },
  {
    id: "3",
    skill: "React Development",
    teacher: { name: "Lisa Wang", avatar: "" },
    learner: { name: "You", avatar: "" },
    dateTime: new Date(Date.now() - 86400000).toISOString(),
    status: "completed" as const,
  },
  {
    id: "4",
    skill: "Data Analysis",
    teacher: { name: "You", avatar: "" },
    learner: { name: "James Wilson", avatar: "" },
    dateTime: new Date(Date.now() - 172800000).toISOString(),
    status: "completed" as const,
  },
];

export default function Sessions() {
  const [sessions] = useState(initialSessions);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    session: (typeof sessions)[0] | null;
  }>({ open: false, session: null });
  const { toast } = useToast();

  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const handleJoin = (sessionId: string) => {
    toast({
      title: "Joining session...",
      description: "Opening video call in a new tab.",
    });
  };

  const handleOpenFeedback = (session: (typeof sessions)[0]) => {
    setFeedbackModal({ open: true, session });
  };

  const handleSubmitFeedback = (rating: number, feedback: string) => {
    toast({
      title: "Feedback submitted!",
      description: "Thank you for your feedback.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your learning sessions
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-2">
              Upcoming
              {upcomingSessions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {upcomingSessions.length}
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

          <TabsContent value="upcoming" className="mt-6">
            {upcomingSessions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming sessions"
                description="When you schedule a session, it will appear here."
              />
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userRole={session.teacher.name === "You" ? "teacher" : "learner"}
                    onJoin={() => handleJoin(session.id)}
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
                    session={session}
                    userRole={session.teacher.name === "You" ? "teacher" : "learner"}
                    onFeedback={() => handleOpenFeedback(session)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {feedbackModal.session && (
        <FeedbackModal
          open={feedbackModal.open}
          onOpenChange={(open) => setFeedbackModal({ ...feedbackModal, open })}
          sessionDetails={{
            skill: feedbackModal.session.skill,
            partnerName:
              feedbackModal.session.teacher.name === "You"
                ? feedbackModal.session.learner.name
                : feedbackModal.session.teacher.name,
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </DashboardLayout>
  );
}

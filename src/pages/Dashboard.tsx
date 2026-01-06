import { Award, BookOpen, GraduationCap, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { SessionCard } from "@/components/SessionCard";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, loading } = useUserStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // All values directly from stats - no fallbacks needed, hook guarantees defaults
  const {
    credibilityScore,
    sessionsCompleted,
    skillsTaughtCount,
    skillsLearnedCount,
    avgRating,
    upcomingSessions,
  } = stats;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your learning journey
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link to="/discover">Find Teachers</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid - ALL FROM useUserStats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Credibility Score"
            value={credibilityScore}
            icon={Award}
            variant="gradient"
            description={credibilityScore > 0 ? "Overall Trust Score" : "Complete sessions to build"}
          />
          <StatCard
            title="Skills Taught"
            value={skillsTaughtCount}
            icon={GraduationCap}
          />
          <StatCard
            title="Skills Learned"
            value={skillsLearnedCount}
            icon={BookOpen}
          />
          <StatCard
            title="Sessions Completed"
            value={sessionsCompleted}
            icon={Calendar}
            description="Total sessions"
          />
        </div>

        {/* Progress & Sessions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Credibility Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <CredibilityBadge score={credibilityScore} size="lg" className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  {credibilityScore >= 80
                    ? "You are a trusted expert!"
                    : credibilityScore > 0
                      ? "Keep learning and teaching to increase your score."
                      : "Complete sessions to start building your score."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sessions</span>
                  <span className="font-medium">{sessionsCompleted} completed</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(sessionsCompleted * 3.33, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Rating</span>
                  <span className="font-medium">
                    {avgRating > 0 ? `${avgRating.toFixed(1)}/5.0` : '0/5.0'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-accent rounded-full transition-all duration-500"
                    style={{ width: `${(avgRating / 5) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions - FROM API */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sessions">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userRole={session.role}
                    onJoin={() => { }}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming sessions</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/discover">Find a teacher to get started</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

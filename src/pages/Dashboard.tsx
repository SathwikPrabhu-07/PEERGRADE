import { Award, BookOpen, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { SessionCard } from "@/components/SessionCard";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Mock data
const upcomingSessions = [
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
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, Alex! 👋
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

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Credibility Score"
            value={78}
            icon={Award}
            variant="gradient"
            description="Top 25% of users"
          />
          <StatCard
            title="Skills Taught"
            value={5}
            icon={GraduationCap}
            trend={{ value: 20, positive: true }}
          />
          <StatCard
            title="Skills Learned"
            value={8}
            icon={BookOpen}
            trend={{ value: 15, positive: true }}
          />
          <StatCard
            title="Sessions Completed"
            value={24}
            icon={Calendar}
            description="This month"
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
                <CredibilityBadge score={78} size="lg" className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  Complete 2 more sessions to reach "Expert" level
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sessions</span>
                  <span className="font-medium">24/30</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: "80%" }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Rating</span>
                  <span className="font-medium">4.8/5.0</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-accent rounded-full transition-all duration-500"
                    style={{ width: "96%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
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
              {upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userRole={session.teacher.name === "You" ? "teacher" : "learner"}
                  onJoin={() => {}}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

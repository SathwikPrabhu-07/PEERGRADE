import { Edit2, GraduationCap, BookOpen, Star, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";

export default function Profile() {
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

  // All values directly from stats - no fallbacks needed
  const {
    credibilityScore,
    sessionsCompleted,
    studentsCount,
    teachingHours,
    avgRating,
    ratingBreakdown,
    totalReviews,
    teachingSkills,
    learningSkills,
  } = stats;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your public profile
            </p>
          </div>
          <Button className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                  <AvatarImage src="" alt={user?.name} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-foreground">
                      {user?.name}
                    </h2>
                    <CredibilityBadge score={credibilityScore} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <RatingStars rating={avgRating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {avgRating > 0 ? `${avgRating.toFixed(1)} overall rating` : 'No ratings yet'}
                    </span>
                  </div>

                  <p className="text-muted-foreground">
                    {user?.bio || "Passionate about teaching and learning. (Bio editing coming soon!)"}
                  </p>
                </div>
              </div>

              {/* Stats - ALL FROM useUserStats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {sessionsCompleted}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {studentsCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {teachingHours}h
                  </p>
                  <p className="text-sm text-muted-foreground">Teaching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Card - REAL BREAKDOWN FROM API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Rating Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-foreground mb-1">
                  {avgRating > 0 ? avgRating.toFixed(1) : '0'}
                </p>
                <RatingStars rating={avgRating} size="md" className="justify-center" />
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {[5, 4, 3, 2, 1].map((star) => {
                const percentage = ratingBreakdown[star] || 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-3">{star}</span>
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Skills Section - FROM useUserStats */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Skills I Teach ({teachingSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teachingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teachingSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="secondary"
                      className="gap-1 py-1.5 px-3"
                    >
                      {skill.name || skill.skillName}
                      {skill.verificationStatus === 'verified' && (
                        <VerificationBadge
                          status="verified"
                          className="ml-1 p-0 bg-transparent"
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                Skills I'm Learning ({learningSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {learningSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {learningSkills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="py-1.5 px-3"
                    >
                      {skill.name || skill.skillName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No skills added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

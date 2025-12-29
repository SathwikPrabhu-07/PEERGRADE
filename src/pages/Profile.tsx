import { Edit2, GraduationCap, BookOpen, Star } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Mock data
const profileData = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatar: "",
  bio: "Passionate about teaching and learning. I specialize in programming and design, with 5+ years of experience in Python and UI/UX. Always excited to share knowledge and learn from others!",
  rating: 4.8,
  credibilityScore: 78,
  skillsTaught: [
    { name: "Python Programming", verified: true },
    { name: "UI/UX Design", verified: true },
    { name: "Data Analysis", verified: false },
  ],
  skillsLearned: [
    { name: "Machine Learning" },
    { name: "Spanish" },
    { name: "Photography" },
  ],
  stats: {
    sessionsCompleted: 24,
    studentsHelped: 18,
    hoursTeaching: 36,
  },
};

export default function Profile() {
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
                  <AvatarImage src={profileData.avatar} alt={profileData.name} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                    {profileData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-foreground">
                      {profileData.name}
                    </h2>
                    <CredibilityBadge score={profileData.credibilityScore} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <RatingStars rating={profileData.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {profileData.rating} overall rating
                    </span>
                  </div>

                  <p className="text-muted-foreground">{profileData.bio}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.stats.sessionsCompleted}
                  </p>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.stats.studentsHelped}
                  </p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {profileData.stats.hoursTeaching}h
                  </p>
                  <p className="text-sm text-muted-foreground">Teaching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Card */}
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
                  {profileData.rating}
                </p>
                <RatingStars rating={profileData.rating} size="md" className="justify-center" />
                <p className="text-sm text-muted-foreground mt-1">Based on 24 reviews</p>
              </div>

              {[5, 4, 3, 2, 1].map((star) => {
                const percentage = star === 5 ? 75 : star === 4 ? 20 : star === 3 ? 5 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm w-3">{star}</span>
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Skills I Teach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.skillsTaught.map((skill) => (
                  <Badge
                    key={skill.name}
                    variant="secondary"
                    className="gap-1 py-1.5 px-3"
                  >
                    {skill.name}
                    {skill.verified && (
                      <VerificationBadge
                        status="verified"
                        className="ml-1 p-0 bg-transparent"
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                Skills I've Learned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.skillsLearned.map((skill) => (
                  <Badge
                    key={skill.name}
                    variant="outline"
                    className="py-1.5 px-3"
                  >
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { Plus, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SkillCard } from "@/components/SkillCard";
import { AddSkillModal } from "@/components/AddSkillModal";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getSkills, addSkill, deleteSkill, getTeachers, getSkillScores, Skill, SkillScore } from "@/lib/api";

export default function MySkills() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State - NO MEMOIZATION
  const [teachingSkills, setTeachingSkills] = useState<Skill[]>([]);
  const [learningSkills, setLearningSkills] = useState<Skill[]>([]);
  const [skillScores, setSkillScores] = useState<SkillScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<"teach" | "learn">("teach");

  // Fetch skills - simple function, no useCallback
  const fetchSkills = async () => {
    if (!user?.id) return;

    try {
      console.log('🔥 [MySkills] Fetching skills for user:', user.id);

      const [skillsResponse, scoresResponse] = await Promise.all([
        getSkills(user.id),
        getSkillScores(user.id)
      ]);

      console.log('🔥 [MySkills] Skills:', skillsResponse.data);
      console.log('🔥 [MySkills] Scores:', scoresResponse.data);

      setTeachingSkills(skillsResponse.data.teachingSkills);
      setLearningSkills(skillsResponse.data.learningSkills);
      setSkillScores(scoresResponse.data);
    } catch (error) {
      console.error('❌ [MySkills] Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    console.log('📌 MySkills mounted');
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openAddModal = (type: "teach" | "learn") => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const handleAddSkill = async (skill: { name: string; category: string; level: string }) => {
    if (!user?.id) return;

    try {
      console.log('🔥 [MySkills] Adding skill:', skill);
      const response = await addSkill(user.id, {
        name: skill.name,
        category: skill.category,
        level: skill.level as 'Beginner' | 'Intermediate' | 'Advanced',
        type: addModalType,
      });

      console.log('🔥 [MySkills] Skill added, response:', response.data);

      // Refetch skills to ensure fresh data
      await fetchSkills();

      // Also verify teachers endpoint is updated
      const teachersResponse = await getTeachers({});
      console.log('🔥 [MySkills] Teachers after skill add:', teachersResponse.data);

      toast({
        title: "Skill added!",
        description: `${skill.name} has been added to your ${addModalType === "teach" ? "teaching" : "learning"} skills.`,
      });
    } catch (error) {
      console.error('❌ [MySkills] Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSkill = async (id: string, type: "teach" | "learn") => {
    if (!user?.id) return;

    try {
      console.log('🔥 [MySkills] Removing skill:', id);
      await deleteSkill(user.id, id);

      // Refetch skills to ensure fresh data
      await fetchSkills();

      // Also verify teachers endpoint is updated
      const teachersResponse = await getTeachers({});
      console.log('🔥 [MySkills] Teachers after skill delete:', teachersResponse.data);

      toast({
        title: "Skill removed",
        description: "The skill has been removed successfully.",
      });
    } catch (error) {
      console.error('❌ [MySkills] Error removing skill:', error);
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStats = (skillId: string) => {
    const score = skillScores.find(s => s.skillId === skillId);
    if (!score) return undefined;
    return {
      score: score.finalScore,
      sessions: score.sessionCount,
    };
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your skills...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Skills</h1>
          <p className="text-muted-foreground mt-1">
            Manage the skills you teach and want to learn
          </p>
        </div>

        {/* Skills I Can Teach */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Skills I Can Teach
            </CardTitle>
            <Button
              size="sm"
              onClick={() => openAddModal("teach")}
              className="gap-1 gradient-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </CardHeader>
          <CardContent>
            {teachingSkills.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No teaching skills yet"
                description="Add skills you can teach and start sharing your knowledge with others."
                action={{
                  label: "Add Your First Skill",
                  onClick: () => openAddModal("teach"),
                }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachingSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={{
                      id: skill.id,
                      name: skill.name || skill.skillName || '',
                      level: skill.level,
                      category: skill.category,
                      rating: skill.rating || 0,
                      verificationStatus: skill.verificationStatus || 'unverified',
                    }}
                    type="teach"
                    onRemove={() => handleRemoveSkill(skill.id, "teach")}
                    stats={getStats(skill.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills I Want to Learn */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              Skills I Want to Learn
            </CardTitle>
            <Button
              size="sm"
              onClick={() => openAddModal("learn")}
              className="gap-1"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </CardHeader>
          <CardContent>
            {learningSkills.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No learning goals yet"
                description="Add skills you want to learn and we'll help you find the perfect teacher."
                action={{
                  label: "Add Your First Goal",
                  onClick: () => openAddModal("learn"),
                }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={{
                      id: skill.id,
                      name: skill.name || skill.skillName || '',
                      level: skill.level,
                      category: skill.category,
                    }}
                    type="learn"
                    onRemove={() => handleRemoveSkill(skill.id, "learn")}
                    stats={getStats(skill.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddSkillModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type={addModalType}
        onSubmit={handleAddSkill}
      />
    </DashboardLayout>
  );
}

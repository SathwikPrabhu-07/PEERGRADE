import { useState } from "react";
import { Plus, GraduationCap, BookOpen } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SkillCard } from "@/components/SkillCard";
import { AddSkillModal } from "@/components/AddSkillModal";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type TeachingSkill = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  rating: number;
  verificationStatus: "verified" | "pending" | "unverified";
};

type LearningSkill = {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
};

// Mock data
const initialTeachingSkills: TeachingSkill[] = [
  {
    id: "1",
    name: "Python Programming",
    level: "Advanced",
    category: "Programming",
    rating: 4.8,
    verificationStatus: "verified",
  },
  {
    id: "2",
    name: "UI/UX Design",
    level: "Intermediate",
    category: "Design",
    rating: 4.5,
    verificationStatus: "verified",
  },
  {
    id: "3",
    name: "Data Analysis",
    level: "Intermediate",
    category: "Programming",
    rating: 4.2,
    verificationStatus: "pending",
  },
];

const initialLearningSkills: LearningSkill[] = [
  {
    id: "4",
    name: "Machine Learning",
    level: "Beginner",
    category: "Programming",
  },
  {
    id: "5",
    name: "Spanish",
    level: "Intermediate",
    category: "Languages",
  },
];

export default function MySkills() {
  const [teachingSkills, setTeachingSkills] = useState(initialTeachingSkills);
  const [learningSkills, setLearningSkills] = useState(initialLearningSkills);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<"teach" | "learn">("teach");
  const { toast } = useToast();

  const openAddModal = (type: "teach" | "learn") => {
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const handleAddSkill = (skill: { name: string; category: string; level: string }) => {
    if (addModalType === "teach") {
      const newTeachSkill = {
        id: Date.now().toString(),
        name: skill.name,
        level: skill.level as "Beginner" | "Intermediate" | "Advanced",
        category: skill.category,
        rating: 0,
        verificationStatus: "pending" as const,
      };
      setTeachingSkills([...teachingSkills, newTeachSkill]);
    } else {
      const newLearnSkill = {
        id: Date.now().toString(),
        name: skill.name,
        level: skill.level as "Beginner" | "Intermediate" | "Advanced",
        category: skill.category,
      };
      setLearningSkills([...learningSkills, newLearnSkill]);
    }

    toast({
      title: "Skill added!",
      description: `${skill.name} has been added to your ${addModalType === "teach" ? "teaching" : "learning"} skills.`,
    });
  };

  const handleRemoveLearningSkill = (id: string) => {
    setLearningSkills(learningSkills.filter((s) => s.id !== id));
    toast({
      title: "Skill removed",
      description: "The skill has been removed from your learning list.",
    });
  };

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
                    skill={skill}
                    type="teach"
                    onEdit={() => {}}
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
                    skill={skill}
                    type="learn"
                    onRemove={() => handleRemoveLearningSkill(skill.id)}
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

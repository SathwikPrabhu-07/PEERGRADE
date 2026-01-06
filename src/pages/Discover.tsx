import { useState, useEffect } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserCard, SkillInfo } from "@/components/UserCard";
import { RequestSkillModal } from "@/components/RequestSkillModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getTeachers, getAllTeachingSkills, getRequests, sendRequest, Teacher, AllTeachingSkill } from "@/lib/api";

const categories = ["All", "Programming", "Design", "Languages", "Music", "Marketing", "Finance"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];

// Teacher with skills joined at render time
interface TeacherWithSkills extends Teacher {
  liveSkills: AllTeachingSkill[];
}

export default function Discover() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [skills, setSkills] = useState<AllTeachingSkill[]>([]);
  const [pendingSkillIds, setPendingSkillIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  // Modal state
  const [requestModal, setRequestModal] = useState<{
    open: boolean;
    teacher: TeacherWithSkills | null;
    skill: SkillInfo | null;
  }>({ open: false, teacher: null, skill: null });

  // Fetch data
  const load = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch teachers, skills, and existing requests in parallel
      const [teachersRes, skillsRes, requestsRes] = await Promise.all([
        getTeachers({ category: selectedCategory, level: selectedLevel, search: searchQuery }),
        getAllTeachingSkills(user.id),
        getRequests(user.id),
      ]);

      setTeachers(teachersRes.data);
      setSkills(skillsRes.data);

      // Track pending request skill IDs
      const pendingIds = new Set<string>();
      [...requestsRes.data.incoming, ...requestsRes.data.outgoing]
        .filter(r => r.status === 'pending')
        .forEach(r => pendingIds.add(r.skillId));
      setPendingSkillIds(pendingIds);

    } catch (error) {
      console.error('[Discover] Error:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and filter change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedCategory, selectedLevel]);

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => load();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedCategory, selectedLevel]);

  // Join skills at render time
  const teachersWithSkills: TeacherWithSkills[] = teachers
    .filter(t => t.id !== user?.id)
    .map(t => ({
      ...t,
      liveSkills: skills.filter(s => s.userId === t.id),
    }))
    .filter(t => t.liveSkills.length > 0); // Only show teachers with skills

  // Handle skill click - open modal
  const handleSkillClick = (teacher: TeacherWithSkills, skill: SkillInfo) => {
    setRequestModal({
      open: true,
      teacher,
      skill,
    });
  };

  // Handle request submission
  const handleRequestSubmit = async (message: string) => {
    if (!user?.id || !requestModal.teacher || !requestModal.skill) return;

    const skill = requestModal.skill;
    const teacher = requestModal.teacher;

    try {
      await sendRequest(user.id, {
        teacherId: teacher.id,
        skillId: skill.id,
        message: message || `Hi! I'd love to learn ${skill.name} from you.`,
      });

      toast({
        title: "Request sent!",
        description: `Your request to learn ${skill.name} from ${teacher.name} has been sent.`,
      });

      // Update pending skill IDs
      setPendingSkillIds(prev => new Set([...prev, skill.id]));
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send request";
      toast({
        title: "Error",
        description: errorMessage.includes("already")
          ? "You already have a pending request for this skill."
          : errorMessage,
        variant: "destructive",
      });
      throw error; // Let modal handle the error
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedLevel("All");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "All" || selectedLevel !== "All";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Discover Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Find the perfect peer to learn from. Click on a skill to request a session.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && <Button variant="ghost" onClick={clearFilters}>Clear</Button>}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {searchQuery && <Badge variant="secondary">Search: {searchQuery}</Badge>}
            {selectedCategory !== "All" && <Badge variant="secondary">{selectedCategory}</Badge>}
            {selectedLevel !== "All" && <Badge variant="secondary">{selectedLevel}</Badge>}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teachersWithSkills.map((teacher) => (
                <UserCard
                  key={teacher.id}
                  user={{
                    id: teacher.id,
                    name: teacher.name,
                    avatar: teacher.avatar,
                    skills: teacher.liveSkills.map(s => ({
                      id: s.id,
                      name: s.name,
                      level: s.level,
                      category: s.category,
                      rating: s.rating,
                    })),
                    credibilityScore: teacher.credibilityScore,
                  }}
                  selectedCategory={selectedCategory}
                  onSkillClick={(skill) => handleSkillClick(teacher, skill)}
                />
              ))}
            </div>

            {teachersWithSkills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No teachers found.</p>
                {hasActiveFilters && <Button variant="link" onClick={clearFilters}>Clear filters</Button>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Skill Modal */}
      {requestModal.teacher && requestModal.skill && (
        <RequestSkillModal
          open={requestModal.open}
          onOpenChange={(open) => setRequestModal(prev => ({ ...prev, open }))}
          teacherName={requestModal.teacher.name}
          skill={requestModal.skill}
          hasPendingRequest={pendingSkillIds.has(requestModal.skill.id)}
          onSubmit={handleRequestSubmit}
        />
      )}
    </DashboardLayout>
  );
}

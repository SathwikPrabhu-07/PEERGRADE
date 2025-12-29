import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserCard } from "@/components/UserCard";
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

const categories = [
  "All",
  "Programming",
  "Design",
  "Languages",
  "Music",
  "Marketing",
  "Finance",
];

const levels = ["All", "Beginner", "Intermediate", "Advanced"];

// Mock data
const teachers = [
  {
    id: "1",
    name: "Alex Chen",
    avatar: "",
    skill: "Python Programming",
    level: "Advanced" as const,
    rating: 4.9,
    credibilityScore: 92,
    category: "Programming",
  },
  {
    id: "2",
    name: "Sarah Miller",
    avatar: "",
    skill: "UI/UX Design",
    level: "Advanced" as const,
    rating: 4.8,
    credibilityScore: 88,
    category: "Design",
  },
  {
    id: "3",
    name: "Marco Rossi",
    avatar: "",
    skill: "Italian Language",
    level: "Advanced" as const,
    rating: 4.7,
    credibilityScore: 75,
    category: "Languages",
  },
  {
    id: "4",
    name: "Emily Johnson",
    avatar: "",
    skill: "Digital Marketing",
    level: "Intermediate" as const,
    rating: 4.6,
    credibilityScore: 68,
    category: "Marketing",
  },
  {
    id: "5",
    name: "David Kim",
    avatar: "",
    skill: "Guitar",
    level: "Advanced" as const,
    rating: 4.9,
    credibilityScore: 85,
    category: "Music",
  },
  {
    id: "6",
    name: "Lisa Wang",
    avatar: "",
    skill: "React Development",
    level: "Intermediate" as const,
    rating: 4.5,
    credibilityScore: 62,
    category: "Programming",
  },
  {
    id: "7",
    name: "James Brown",
    avatar: "",
    skill: "Financial Analysis",
    level: "Advanced" as const,
    rating: 4.7,
    credibilityScore: 79,
    category: "Finance",
  },
  {
    id: "8",
    name: "Anna Schmidt",
    avatar: "",
    skill: "German Language",
    level: "Advanced" as const,
    rating: 4.8,
    credibilityScore: 82,
    category: "Languages",
  },
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const { toast } = useToast();

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || teacher.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "All" || teacher.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleRequestSession = (teacherName: string) => {
    toast({
      title: "Session request sent!",
      description: `Your request has been sent to ${teacherName}. They'll respond soon.`,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedLevel("All");
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "All" || selectedLevel !== "All";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Discover Teachers
          </h1>
          <p className="text-muted-foreground mt-1">
            Find the perfect peer to learn from
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills or teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
              </Badge>
            )}
            {selectedCategory !== "All" && (
              <Badge variant="secondary">{selectedCategory}</Badge>
            )}
            {selectedLevel !== "All" && (
              <Badge variant="secondary">{selectedLevel}</Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeachers.map((teacher) => (
            <UserCard
              key={teacher.id}
              user={teacher}
              onRequestSession={() => handleRequestSession(teacher.name)}
            />
          ))}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No teachers found matching your criteria.
            </p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

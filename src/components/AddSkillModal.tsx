import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "teach" | "learn";
  onSubmit: (skill: {
    name: string;
    category: string;
    level: string;
    description?: string;
  }) => void;
}

const categories = [
  "Programming",
  "Design",
  "Languages",
  "Music",
  "Marketing",
  "Finance",
  "Photography",
  "Writing",
  "Fitness",
  "Cooking",
  "Other",
];

export function AddSkillModal({
  open,
  onOpenChange,
  type,
  onSubmit,
}: AddSkillModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && category && level) {
      onSubmit({ name, category, level, description });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setLevel("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "teach" ? "Add a skill you can teach" : "Add a skill to learn"}
          </DialogTitle>
          <DialogDescription>
            {type === "teach"
              ? "Share your expertise with the community"
              : "Find peers who can help you learn"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              placeholder="e.g., Python Programming, Guitar, Spanish"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">
              {type === "teach" ? "Your proficiency level" : "Desired level"}
            </Label>
            <Select value={level} onValueChange={setLevel} required>
              <SelectTrigger id="level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "teach" && (
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your experience and teaching approach..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gradient-primary text-primary-foreground hover:opacity-90">
              Add Skill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

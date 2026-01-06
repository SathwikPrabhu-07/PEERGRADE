import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Star } from "lucide-react";
import { Assignment } from "@/lib/api";

interface GradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignment: Assignment;
    onSubmit: (scores: Record<string, number>, comment: string) => Promise<void>;
}

export function GradeModal({ open, onOpenChange, assignment, onSubmit }: GradeModalProps) {
    const [scores, setScores] = useState<Record<string, number>>({});
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScoreChange = (questionId: string, score: number) => {
        setScores(prev => ({ ...prev, [questionId]: score }));
    };

    const allQuestionsScored = assignment.questions.every(q => scores[q.id] !== undefined);

    const handleSubmit = async () => {
        if (!allQuestionsScored) return;

        setIsSubmitting(true);
        try {
            await onSubmit(scores, comment);
            setScores({});
            setComment("");
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Evaluate Assignment: {assignment.skillName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {assignment.questions.map((question, idx) => (
                        <div key={question.id} className="space-y-3 p-4 border rounded-lg">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">
                                    Question {idx + 1}
                                </Label>
                                <p className="text-sm mt-1">{question.text}</p>
                            </div>

                            <div className="p-3 bg-muted rounded-md">
                                <Label className="text-xs text-muted-foreground">Student's Answer:</Label>
                                <p className="text-sm mt-1">
                                    {assignment.answers[question.id] || "No answer provided"}
                                </p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Score (1-5)</Label>
                                <div className="flex gap-2 mt-2">
                                    {[1, 2, 3, 4, 5].map(score => (
                                        <Button
                                            key={score}
                                            type="button"
                                            variant={scores[question.id] === score ? "default" : "outline"}
                                            size="sm"
                                            className="w-10 h-10"
                                            onClick={() => handleScoreChange(question.id, score)}
                                        >
                                            {score}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="space-y-2">
                        <Label htmlFor="comment">Feedback Comment (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Provide feedback to the student..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!allQuestionsScored || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Grades"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

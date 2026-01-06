import { useState, useEffect, useCallback } from "react";
import { BookOpen, Loader2, CheckCircle, Clock, Send, Star, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState } from "@/components/EmptyState";
import { GradeModal } from "@/components/GradeModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignments, getSessionAssignments, submitAssignment, gradeAssignment, Assignment, getSessions } from "@/lib/api";

export default function Assignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [toGradeAssignments, setToGradeAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [gradeModal, setGradeModal] = useState<{ open: boolean; assignment: Assignment | null }>({
        open: false,
        assignment: null,
    });
    const { toast } = useToast();

    // Fetch assignments from backend
    const fetchAssignments = useCallback(async () => {
        if (!user?.id) return;

        try {
            console.log('[Assignments] Fetching assignments for user:', user.id);

            // Get user's own assignments
            const response = await getAssignments(user.id);
            setAssignments(response.data.all);

            // Get assignments to grade (from sessions where user is teacher)
            const sessionsResponse = await getSessions(user.id);
            const teacherSessions = sessionsResponse.data.all.filter(
                s => s.teacherId === user.id && s.status === 'completed'
            );

            const assignmentsToGrade: Assignment[] = [];
            for (const session of teacherSessions) {
                try {
                    const sessionAssignments = await getSessionAssignments(user.id, session.id);
                    // Only include assignments from learners (not the teacher's own)
                    const learnerAssignments = sessionAssignments.data.filter(
                        a => a.userId !== user.id && a.submitted && !a.graded
                    );
                    assignmentsToGrade.push(...learnerAssignments);
                } catch {
                    // Session might not have assignments
                }
            }
            setToGradeAssignments(assignmentsToGrade);

            console.log('[Assignments] Fetched:', response.data.all.length, 'own,', assignmentsToGrade.length, 'to grade');
        } catch (error) {
            console.error('[Assignments] Error fetching assignments:', error);
            toast({
                title: "Error",
                description: "Failed to load assignments. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, toast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const pendingAssignments = assignments.filter((a) => !a.submitted);
    const completedAssignments = assignments.filter((a) => a.submitted);

    const handleAnswerChange = (assignmentId: string, questionId: string, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [assignmentId]: {
                ...prev[assignmentId],
                [questionId]: value,
            },
        }));
    };

    const handleSubmitAssignment = async (assignment: Assignment) => {
        if (!user?.id) return;

        const assignmentAnswers = answers[assignment.id] || {};
        const allAnswered = assignment.questions.every(q => assignmentAnswers[q.id]?.trim());

        if (!allAnswered) {
            toast({
                title: "Incomplete",
                description: "Please answer all questions before submitting.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(assignment.id);

        try {
            await submitAssignment(user.id, assignment.id, assignmentAnswers);

            // Update local state
            setAssignments(prev => prev.map(a =>
                a.id === assignment.id
                    ? { ...a, submitted: true, submittedAt: new Date().toISOString(), answers: assignmentAnswers }
                    : a
            ));

            toast({
                title: "Assignment Submitted!",
                description: "Your answers have been saved.",
            });

            setExpandedId(null);
        } catch (error) {
            console.error('[Assignments] Error submitting:', error);
            toast({
                title: "Error",
                description: "Failed to submit assignment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(null);
        }
    };

    const handleGradeSubmit = async (scores: Record<string, number>, comment: string) => {
        if (!user?.id || !gradeModal.assignment) return;

        await gradeAssignment(user.id, gradeModal.assignment.id, scores, comment);

        // Remove from to-grade list
        setToGradeAssignments(prev => prev.filter(a => a.id !== gradeModal.assignment!.id));

        toast({
            title: "Assignment Graded!",
            description: "The student's skill score has been updated.",
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading assignments...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const renderAssignmentCard = (assignment: Assignment, showSubmitButton: boolean, isTeacherView: boolean = false) => (
        <Card key={assignment.id} className={assignment.graded ? "border-green-200 bg-green-50/50" : assignment.submitted ? "opacity-90" : ""}>
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedId(expandedId === assignment.id ? null : assignment.id)}>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{assignment.skillName}</CardTitle>
                        <CardDescription className="mt-1">
                            {assignment.questions.length} questions
                            {assignment.graded && assignment.finalScore && (
                                <span className="ml-2 text-green-600 font-medium">
                                    Score: {assignment.finalScore.toFixed(1)}/5
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {assignment.graded ? (
                            <Badge variant="default" className="bg-green-500">
                                <Star className="h-3 w-3 mr-1" /> Graded
                            </Badge>
                        ) : assignment.submitted ? (
                            <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                            </Badge>
                        ) : (
                            <Badge variant="default">
                                <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            {expandedId === assignment.id && (
                <CardContent className="pt-0 space-y-4">
                    {assignment.questions.map((question, idx) => (
                        <div key={question.id} className="space-y-2">
                            <label className="text-sm font-medium">
                                {idx + 1}. {question.text}
                                {assignment.graded && assignment.scores && (
                                    <span className="ml-2 text-green-600">
                                        ({assignment.scores[question.id]}/5)
                                    </span>
                                )}
                            </label>
                            {assignment.submitted ? (
                                <div className="p-3 bg-muted rounded-md text-sm">
                                    {assignment.answers[question.id] || "No answer provided"}
                                </div>
                            ) : (
                                <Textarea
                                    placeholder="Type your answer..."
                                    value={answers[assignment.id]?.[question.id] || ""}
                                    onChange={(e) => handleAnswerChange(assignment.id, question.id, e.target.value)}
                                    rows={3}
                                />
                            )}
                        </div>
                    ))}

                    {/* Teacher comment display */}
                    {assignment.graded && assignment.graderComment && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                                <MessageSquare className="h-4 w-4" />
                                Teacher Feedback
                            </div>
                            <p className="text-sm text-blue-800">{assignment.graderComment}</p>
                        </div>
                    )}

                    {showSubmitButton && !assignment.submitted && (
                        <Button
                            onClick={() => handleSubmitAssignment(assignment)}
                            disabled={submitting === assignment.id}
                            className="w-full"
                        >
                            {submitting === assignment.id ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                            ) : (
                                <><Send className="h-4 w-4 mr-2" /> Submit Assignment</>
                            )}
                        </Button>
                    )}

                    {isTeacherView && assignment.submitted && !assignment.graded && (
                        <Button
                            onClick={() => setGradeModal({ open: true, assignment })}
                            className="w-full bg-yellow-500 hover:bg-yellow-600"
                        >
                            <Star className="h-4 w-4 mr-2" /> Evaluate Assignment
                        </Button>
                    )}
                </CardContent>
            )}
        </Card>
    );

    return (
        <DashboardLayout>
            <div className="container max-w-4xl py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="h-8 w-8" />
                        Assignments
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Practice and reinforce what you've learned from your sessions.
                    </p>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-3">
                        <TabsTrigger value="pending" className="gap-2">
                            Pending
                            {pendingAssignments.length > 0 && (
                                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {pendingAssignments.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            Completed
                            {completedAssignments.length > 0 && (
                                <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    {completedAssignments.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="to-grade" className="gap-2">
                            To Grade
                            {toGradeAssignments.length > 0 && (
                                <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                    {toGradeAssignments.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-6">
                        {pendingAssignments.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No pending assignments"
                                description="Complete a session to receive practice assignments."
                            />
                        ) : (
                            <div className="space-y-4">
                                {pendingAssignments.map((assignment) => renderAssignmentCard(assignment, true))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                        {completedAssignments.length === 0 ? (
                            <EmptyState
                                icon={CheckCircle}
                                title="No completed assignments"
                                description="Your submitted assignments will appear here."
                            />
                        ) : (
                            <div className="space-y-4">
                                {completedAssignments.map((assignment) => renderAssignmentCard(assignment, false))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="to-grade" className="mt-6">
                        {toGradeAssignments.length === 0 ? (
                            <EmptyState
                                icon={Star}
                                title="No assignments to grade"
                                description="Assignments from your students will appear here."
                            />
                        ) : (
                            <div className="space-y-4">
                                {toGradeAssignments.map((assignment) => renderAssignmentCard(assignment, false, true))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Grade Modal */}
            {gradeModal.assignment && (
                <GradeModal
                    open={gradeModal.open}
                    onOpenChange={(open) => setGradeModal({ ...gradeModal, open })}
                    assignment={gradeModal.assignment}
                    onSubmit={handleGradeSubmit}
                />
            )}
        </DashboardLayout>
    );
}

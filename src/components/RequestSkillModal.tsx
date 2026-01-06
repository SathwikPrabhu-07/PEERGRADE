import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";

interface RequestSkillModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacherName: string;
    skill: {
        id: string;
        name: string;
        level: string;
    };
    hasPendingRequest: boolean;
    onSubmit: (message: string) => Promise<void>;
}

export function RequestSkillModal({
    open,
    onOpenChange,
    teacherName,
    skill,
    hasPendingRequest,
    onSubmit,
}: RequestSkillModalProps) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (hasPendingRequest) return;

        setIsSubmitting(true);
        try {
            await onSubmit(message);
            setMessage("");
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Session</DialogTitle>
                    <DialogDescription>
                        Send a learning request to {teacherName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Selected Skill - Read Only */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">
                            Selected Skill
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge className="text-sm">{skill.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                                ({skill.level})
                            </span>
                        </div>
                    </div>

                    {/* Warning if pending request exists */}
                    {hasPendingRequest && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Request Already Exists
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                    You already have a pending request for this skill.
                                    Please wait for a response or cancel the existing request.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Message Input */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">
                            Message (optional)
                        </label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Hi! I'd love to learn ${skill.name} from you...`}
                            className="mt-1"
                            rows={3}
                            disabled={hasPendingRequest}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={hasPendingRequest || isSubmitting}
                        className="gradient-primary text-primary-foreground"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

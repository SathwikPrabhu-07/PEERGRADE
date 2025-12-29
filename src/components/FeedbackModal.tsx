import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/RatingStars";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionDetails: {
    skill: string;
    partnerName: string;
  };
  onSubmit: (rating: number, feedback: string) => void;
}

export function FeedbackModal({
  open,
  onOpenChange,
  sessionDetails,
  onSubmit,
}: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedback);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setFeedback("");
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!submitted) {
      setRating(0);
      setFeedback("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-muted-foreground">
              Your rating helps build trust in our community.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Rate your session</DialogTitle>
              <DialogDescription>
                How was your {sessionDetails.skill} session with{" "}
                {sessionDetails.partnerName}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Tap to rate
                </span>
                <RatingStars
                  rating={rating}
                  size="lg"
                  interactive
                  onRatingChange={setRating}
                />
                {rating > 0 && (
                  <span className="text-sm font-medium text-primary">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="feedback"
                  className="text-sm font-medium text-foreground"
                >
                  Share your experience (optional)
                </label>
                <Textarea
                  id="feedback"
                  placeholder="What did you enjoy? Any suggestions for improvement?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90"
              >
                Submit Feedback
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

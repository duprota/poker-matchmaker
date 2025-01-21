import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlayerFeedbackProps {
  playerId: string;
  playerName: string;
  onFeedbackSubmitted?: () => void;
}

export const PlayerFeedback = ({ playerId, playerName, onFeedbackSubmitted }: PlayerFeedbackProps) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentField, setShowCommentField] = useState(false);
  const { toast } = useToast();
  const maxCharacters = 144;

  const handleVote = async (voteType: 'like' | 'dislike') => {
    setIsSubmitting(true);
    try {
      console.log("Submitting vote:", { playerId, voteType });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit feedback",
          variant: "destructive",
        });
        return;
      }

      // Get the current user's player ID
      const { data: fromPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("player_feedback")
        .upsert({
          from_player_id: fromPlayer?.id || user.id, // Fallback to user.id if no player found
          to_player_id: playerId,
          vote_type: voteType,
        }, {
          onConflict: 'from_player_id,to_player_id'
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: `You gave a ${voteType} to ${playerName}`,
      });

      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Could not submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a comment",
          variant: "destructive",
        });
        return;
      }

      // Get the current user's player ID
      const { data: fromPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("player_feedback")
        .upsert({
          from_player_id: fromPlayer?.id || user.id, // Fallback to user.id if no player found
          to_player_id: playerId,
          comment: comment.trim(),
          vote_type: 'like' // Default to like when only commenting
        }, {
          onConflict: 'from_player_id,to_player_id'
        });

      if (error) throw error;

      toast({
        title: "Comment submitted!",
        description: "Your comment has been added",
      });

      setComment("");
      setShowCommentField(false);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Could not submit comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('like')}
          disabled={isSubmitting}
          className="hover:bg-green-500/10 hover:text-green-500"
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={isSubmitting}
          className="hover:bg-red-500/10 hover:text-red-500"
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCommentField(!showCommentField)}
          className="hover:bg-primary/10"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {showCommentField && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{comment.length}/{maxCharacters} characters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommentField(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, maxCharacters))}
              className="min-h-[80px] text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={isSubmitting || !comment.trim()}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
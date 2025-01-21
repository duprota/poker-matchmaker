import { useState, useEffect } from "react";
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
  const [currentVote, setCurrentVote] = useState<'like' | 'dislike' | null>(null);
  const [stats, setStats] = useState({ likes: 0, dislikes: 0 });
  const { toast } = useToast();
  const maxCharacters = 144;

  const fetchStats = async () => {
    try {
      console.log("Fetching feedback stats for player:", playerId);
      
      const { data: feedbackData } = await supabase
        .from("player_feedback")
        .select("vote_type")
        .eq("to_player_id", playerId);

      if (feedbackData) {
        const likes = feedbackData.filter(f => f.vote_type === 'like').length;
        const dislikes = feedbackData.filter(f => f.vote_type === 'dislike').length;
        setStats({ likes, dislikes });
      }

      // Get current user's vote
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userFeedback } = await supabase
          .from("player_feedback")
          .select("vote_type")
          .eq('from_player_id', user.id)
          .eq('to_player_id', playerId)
          .maybeSingle();

        if (userFeedback) {
          setCurrentVote(userFeedback.vote_type as 'like' | 'dislike');
        } else {
          setCurrentVote(null);
        }
      }
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [playerId]);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit feedback",
          variant: "destructive",
        });
        return;
      }

      // First check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from("player_feedback")
        .select()
        .eq('from_player_id', user.id)
        .eq('to_player_id', playerId)
        .maybeSingle();

      let error;
      
      // If clicking the same vote type again, remove the vote
      const newVoteType = existingFeedback?.vote_type === voteType ? null : voteType;
      
      if (existingFeedback) {
        if (newVoteType === null) {
          // Remove vote
          const { error: deleteError } = await supabase
            .from("player_feedback")
            .delete()
            .eq('from_player_id', user.id)
            .eq('to_player_id', playerId);
          error = deleteError;
        } else {
          // Update existing feedback
          const { error: updateError } = await supabase
            .from("player_feedback")
            .update({ vote_type: newVoteType })
            .eq('from_player_id', user.id)
            .eq('to_player_id', playerId);
          error = updateError;
        }
      } else if (newVoteType !== null) {
        // Insert new feedback
        const { error: insertError } = await supabase
          .from("player_feedback")
          .insert({
            from_player_id: user.id,
            to_player_id: playerId,
            vote_type: newVoteType,
          });
        error = insertError;
      }

      if (error) throw error;

      setCurrentVote(newVoteType);
      fetchStats();
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

      // Check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from("player_feedback")
        .select()
        .eq('from_player_id', user.id)
        .eq('to_player_id', playerId)
        .single();

      let error;

      if (existingFeedback) {
        // Update existing feedback with new comment
        const { error: updateError } = await supabase
          .from("player_feedback")
          .update({ comment: comment.trim() })
          .eq('from_player_id', user.id)
          .eq('to_player_id', playerId);
        error = updateError;
      } else {
        // Insert new feedback with comment
        const { error: insertError } = await supabase
          .from("player_feedback")
          .insert({
            from_player_id: user.id,
            to_player_id: playerId,
            comment: comment.trim(),
            vote_type: 'like' // Default to like when only commenting
          });
        error = insertError;
      }

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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote(currentVote === 'like' ? 'dislike' : 'like')}
            disabled={isSubmitting}
            className={`flex items-center gap-2 ${
              currentVote === 'like' ? 'bg-green-500/10 text-green-500' : 
              currentVote === 'dislike' ? 'bg-red-500/10 text-red-500' : ''
            }`}
          >
            {currentVote === 'dislike' ? (
              <ThumbsDown className="w-4 h-4" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {currentVote === 'dislike' ? stats.dislikes : stats.likes}
            </span>
          </Button>
        </div>
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

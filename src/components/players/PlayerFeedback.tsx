import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlayerFeedbackProps {
  playerId: string;
  playerName: string;
}

export const PlayerFeedback = ({ playerId, playerName }: PlayerFeedbackProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleVote = async (voteType: 'like' | 'dislike') => {
    setIsSubmitting(true);
    try {
      console.log("Submitting vote:", { playerId, voteType, comment });
      
      // Get the current user's player ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: fromPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!fromPlayer) throw new Error("Player not found");

      const { error } = await supabase
        .from("player_feedback")
        .upsert({
          from_player_id: fromPlayer.id,
          to_player_id: playerId,
          vote_type: voteType,
          comment: comment.trim() || null
        }, {
          onConflict: 'from_player_id,to_player_id'
        });

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: `Você deu um ${voteType === 'like' ? 'like' : 'dislike'} para ${playerName}`,
      });

      setIsOpen(false);
      setComment("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Dar Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback para {playerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 flex-col gap-2 h-auto py-6 hover:bg-green-500/10 hover:text-green-500 group"
              onClick={() => handleVote('like')}
              disabled={isSubmitting}
            >
              <ThumbsUp className="w-8 h-8 group-hover:animate-bounce" />
              <span>Like</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 flex-col gap-2 h-auto py-6 hover:bg-red-500/10 hover:text-red-500 group"
              onClick={() => handleVote('dislike')}
              disabled={isSubmitting}
            >
              <ThumbsDown className="w-8 h-8 group-hover:animate-bounce" />
              <span>Dislike</span>
            </Button>
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Comentário (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
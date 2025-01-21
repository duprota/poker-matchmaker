import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlayerFeedbackStatsProps {
  playerId: string;
}

interface FeedbackStats {
  likes: number;
  dislikes: number;
  recentComments: {
    vote_type: 'like' | 'dislike';
    comment: string;
  }[];
}

export const PlayerFeedbackStats = ({ playerId }: PlayerFeedbackStatsProps) => {
  const [stats, setStats] = useState<FeedbackStats>({
    likes: 0,
    dislikes: 0,
    recentComments: []
  });

  const fetchStats = async () => {
    try {
      console.log("Fetching feedback stats for player:", playerId);
      
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("player_feedback")
        .select("vote_type, comment")
        .eq("to_player_id", playerId);

      if (feedbackError) throw feedbackError;

      const likes = feedbackData.filter(f => f.vote_type === 'like').length;
      const dislikes = feedbackData.filter(f => f.vote_type === 'dislike').length;
      const recentComments = feedbackData
        .filter(f => f.comment)
        .slice(0, 3)
        .map(f => ({
          vote_type: f.vote_type,
          comment: f.comment
        }));

      setStats({ likes, dislikes, recentComments });
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [playerId]);

  if (stats.likes === 0 && stats.dislikes === 0 && stats.recentComments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">{stats.likes}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">{stats.dislikes}</span>
        </div>
      </div>

      {stats.recentComments.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-1">
            {stats.recentComments.map((comment, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                <span className={comment.vote_type === 'like' ? 'text-green-500' : 'text-red-500'}>
                  {comment.vote_type === 'like' ? '👍' : '👎'}
                </span>
                {" "}
                {comment.comment}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
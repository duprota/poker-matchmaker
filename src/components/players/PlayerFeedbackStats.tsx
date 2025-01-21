import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlayerFeedbackStatsProps {
  playerId: string;
}

interface FeedbackStats {
  recentComments: {
    vote_type: 'like' | 'dislike';
    comment: string;
  }[];
}

export const PlayerFeedbackStats = ({ playerId }: PlayerFeedbackStatsProps) => {
  const [stats, setStats] = useState<FeedbackStats>({
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

      const recentComments = feedbackData
        .filter(f => f.comment)
        .slice(0, 3)
        .map(f => ({
          vote_type: f.vote_type,
          comment: f.comment
        }));

      setStats({ recentComments });
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [playerId]);

  if (stats.recentComments.length === 0) {
    return null;
  }

  return (
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
  );
};
export interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  total_winnings: number;
  biggest_win: number;
  total_spent: number;
  roi_percentage: number;
  average_roi: number;
  best_game_roi: number;
  worst_game_roi: number;
  average_winnings: number;
  net_earnings: number;
  average_net_earnings: number;
  special_hands?: { [key: string]: number };
}

export type RankingType = "total" | "average" | "special";

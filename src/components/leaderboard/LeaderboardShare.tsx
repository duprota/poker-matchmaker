import { Button } from "@/components/ui/button";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";

interface LeaderboardShareProps {
  leaderboard: LeaderboardEntry[];
  timeFilter: string;
  rankingType: RankingType;
}

export const LeaderboardShare = ({ leaderboard, timeFilter, rankingType }: LeaderboardShareProps) => {
  const handleShareWhatsApp = () => {
    const totalMoneyWon = leaderboard.reduce((acc, player) => acc + Math.max(0, player.net_earnings), 0);
    const totalGamesPlayed = leaderboard.reduce((acc, player) => acc + player.games_played, 0);

    const summaryText = 
`🏆 Poker Leaderboard ${timeFilter} (${rankingType === "total" ? "Total Net Earnings" : "Average Net Earnings per Game"})

💰 Total Money Won: $${totalMoneyWon}
🎮 Total Games Played: ${totalGamesPlayed}

👑 Top Players:
${leaderboard.slice(0, 5).map((player, index) => {
  const position = index + 1;
  const emoji = position === 1 ? '👑' : position === 2 ? '🥈' : position === 3 ? '🥉' : '⭐';
  const value = rankingType === "total" ? player.net_earnings : player.average_net_earnings;
  const roi = player.roi_percentage.toFixed(1);
  return `${emoji} ${player.player_name}
   💵 ${rankingType === "total" ? `$${value}` : `$${value.toFixed(2)}/game`} (${roi}% ROI)
   🎲 ${player.games_played} games
   📈 Best Game ROI: ${player.best_game_roi.toFixed(1)}%
`;
}).join('\n')}
🔥 Most Profitable Players:
${leaderboard
  .filter(p => p.roi_percentage > 0)
  .sort((a, b) => b.roi_percentage - a.roi_percentage)
  .slice(0, 3)
  .map(player => `📊 ${player.player_name}: ${player.roi_percentage.toFixed(1)}% ROI`).join('\n')}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`);
  };

  return (
    <div className="mt-6 flex justify-center">
      <Button
        size="lg"
        className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity animate-fade-in"
        onClick={handleShareWhatsApp}
      >
        Share on WhatsApp
      </Button>
    </div>
  );
};

import { Button } from "@/components/ui/button";
import { LeaderboardEntry, RankingType } from "@/types/leaderboard";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardShareProps {
  leaderboard: LeaderboardEntry[];
  timeFilter: string;
  rankingType: RankingType;
}

export const LeaderboardShare = ({ leaderboard, timeFilter, rankingType }: LeaderboardShareProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
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

    try {
      // Primeiro tenta usar a API nativa de compartilhamento
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: 'Poker Leaderboard',
          text: summaryText
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      // Se não puder usar a API de compartilhamento, usa o fallback de copiar
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: "Copiado para área de transferência",
        description: "O texto foi copiado para sua área de transferência"
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Tenta o fallback de copiar mesmo se o compartilhamento falhar
      try {
        await navigator.clipboard.writeText(summaryText);
        toast({
          title: "Copiado para área de transferência",
          description: "O texto foi copiado para sua área de transferência"
        });
      } catch (clipboardError) {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o conteúdo",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center">
      <Button
        size="lg"
        className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity animate-fade-in mx-4"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5 mr-2" />
        Compartilhar
      </Button>
    </div>
  );
};


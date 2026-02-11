import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GamePlayer } from "@/types/game";
import { calculateFinalResult } from "../GameCalculations";
import { format } from "date-fns";

interface ShareButtonProps {
  players: GamePlayer[];
  date: string;
  name?: string;
  place?: string;
}

export const ShareButton = ({ players, date, name, place }: ShareButtonProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const sortedPlayers = [...players].sort((a, b) => {
      const resultA = calculateFinalResult(a);
      const resultB = calculateFinalResult(b);
      return resultB - resultA;
    });

    const winner = sortedPlayers[0];
    const winnerProfit = calculateFinalResult(winner);
    const winnerROI = ((winnerProfit / (winner.initial_buyin + (winner.total_rebuys * winner.initial_buyin))) * 100).toFixed(2);

    const totalMoneyInPlay = players.reduce((acc, player) => {
      return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
    }, 0);

    const totalRebuys = players.reduce((acc, player) => acc + player.total_rebuys, 0);
    const mostRebuys = players.reduce((acc, player) => Math.max(acc, player.total_rebuys), 0);
    const playerWithMostRebuys = players.find(player => player.total_rebuys === mostRebuys);
    const highestSingleWin = Math.max(...players.map(player => calculateFinalResult(player)));

    const summaryText = `🎰 ${name ? name + ' - ' : ''}${format(new Date(date), 'PPp')}\n` +
      `${place ? `📍 ${place}\n` : ''}` +
      `\n🏆 Winner: ${winner.player.name} (+$${winnerProfit}) - ROI: ${winnerROI}%\n\n` +
      `📊 Rankings:\n${sortedPlayers.map((p, i) => {
        const result = calculateFinalResult(p);
        const roi = ((result / (p.initial_buyin + (p.total_rebuys * p.initial_buyin))) * 100).toFixed(2);
        return `${i + 1}. ${p.player.name}: ${result >= 0 ? '+' : ''}$${result} (ROI: ${roi}%)`;
      }).join('\n')}\n\n` +
      `💰 Game Stats:\n` +
      `• Total Money in Play: $${totalMoneyInPlay}\n` +
      `• Total Rebuys: ${totalRebuys}\n` +
      `• Highest Win: $${highestSingleWin}\n` +
      `• Most Rebuys: ${playerWithMostRebuys?.player.name} (${mostRebuys})`;

    try {
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: name || 'Poker Game Summary',
          text: summaryText
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: "Copiado para área de transferência",
        description: "O texto foi copiado para sua área de transferência"
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
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
    <div className="flex justify-center pt-4">
      <Button
        size="lg"
        className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5 mr-2" />
        Compartilhar
      </Button>
    </div>
  );
};

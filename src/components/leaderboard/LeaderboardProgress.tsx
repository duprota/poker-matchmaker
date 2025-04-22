
import { PlayerProgressChart } from "./PlayerProgressChart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp } from "lucide-react";

interface LeaderboardProgressProps {
  playerProgressData: any[];
}

export const LeaderboardProgress = ({ playerProgressData }: LeaderboardProgressProps) => {
  return (
    <div className="w-full">
      {playerProgressData && playerProgressData.length > 0 ? (
        <PlayerProgressChart playersData={playerProgressData} />
      ) : (
        <Alert>
          <TrendingUp className="h-4 w-4 mr-2" />
          <AlertDescription>
            Nenhum dado disponível para exibição. Os jogadores precisam participar de pelo menos um jogo para aparecer no gráfico.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

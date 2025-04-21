
import { PlayerProgressChart } from "./PlayerProgressChart";

interface LeaderboardProgressProps {
  playerProgressData: any[];
}

export const LeaderboardProgress = ({ playerProgressData }: LeaderboardProgressProps) => {
  return (
    <div className="mt-4 md:mt-8">
      {playerProgressData && playerProgressData.length > 0 ? (
        <PlayerProgressChart playersData={playerProgressData} />
      ) : (
        <div className="text-center py-6">No data available</div>
      )}
    </div>
  );
};

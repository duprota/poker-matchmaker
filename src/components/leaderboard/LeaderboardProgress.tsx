
import { PlayerProgressChart } from "./PlayerProgressChart";

interface LeaderboardProgressProps {
  playerProgressData: any[];
}

export const LeaderboardProgress = ({ playerProgressData }: LeaderboardProgressProps) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Players Progress</h2>
      {playerProgressData && playerProgressData.length > 0 ? (
        <PlayerProgressChart playersData={playerProgressData} />
      ) : (
        <div className="text-center py-6">No data available</div>
      )}
    </div>
  );
};

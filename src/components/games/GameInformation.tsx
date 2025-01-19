import { GamePlayer } from "@/types/game";

interface GameInformationProps {
  date: string;
  status: string;
  hasBalanceError: boolean;
  totalBuyInsAndRebuys: number;
  totalResults: number;
  players: GamePlayer[];
}

export const GameInformation = ({ 
  date, 
  status, 
}: GameInformationProps) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Game Information</h2>
      <p>Date: {new Date(date).toLocaleDateString()}</p>
      <p>Status: {status}</p>
    </div>
  );
};
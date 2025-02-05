
import { GamePlayer } from "@/types/game";

interface GameInformationProps {
  date: string;
  status: string;
  hasBalanceError: boolean;
  totalBuyInsAndRebuys: number;
  totalResults: number;
  players: GamePlayer[];
  name?: string;
}

export const GameInformation = ({ 
  date, 
  status,
  name,
}: GameInformationProps) => {
  return null; // Component no longer renders any UI
};

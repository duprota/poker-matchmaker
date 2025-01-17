import { Alert, AlertDescription } from "@/components/ui/alert";
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
  hasBalanceError,
  totalBuyInsAndRebuys,
  totalResults,
}: GameInformationProps) => {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Game Information</h2>
        <p>Date: {new Date(date).toLocaleDateString()}</p>
        <p>Status: {status}</p>
      </div>

      {hasBalanceError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Warning: The sum of final results (${totalResults}) does not match the total buy-ins and rebuys (${totalBuyInsAndRebuys}). 
            The difference is ${Math.abs(totalResults - totalBuyInsAndRebuys)}. 
            Please update the results to ensure they balance.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
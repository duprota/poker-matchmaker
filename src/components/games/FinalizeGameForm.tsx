import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GamePlayer } from "@/types/game";
import { calculateTotalBuyInsAndRebuys } from "./GameCalculations";

interface FinalizeGameFormProps {
  isOpen: boolean;
  onClose: () => void;
  players: GamePlayer[];
  onFinalize: (results: Record<string, number>) => void;
}

export const FinalizeGameForm = ({ 
  isOpen, 
  onClose, 
  players,
  onFinalize 
}: FinalizeGameFormProps) => {
  const [results, setResults] = useState<Record<string, number>>({});
  const totalMoneyInGame = calculateTotalBuyInsAndRebuys(players);
  const totalResults = Object.values(results).reduce((acc, val) => acc + (val || 0), 0);
  const difference = totalMoneyInGame - totalResults;

  const handleResultChange = (playerId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0
    }));
  };

  const handleFinalize = () => {
    if (difference === 0) {
      onFinalize(results);
    }
  };

  useEffect(() => {
    // Initialize results with 0 for each player
    const initialResults: Record<string, number> = {};
    players.forEach(player => {
      initialResults[player.id] = 0;
    });
    setResults(initialResults);
  }, [players]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Finalize Game</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold">Total Money in Game: ${totalMoneyInGame}</p>
            <p className="text-sm text-muted-foreground mt-1">
              This includes all buy-ins and rebuys
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Final Results</h3>
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-4">
                <span className="min-w-[150px]">{player.player.name}</span>
                <Input
                  type="number"
                  value={results[player.id] || 0}
                  onChange={(e) => handleResultChange(player.id, e.target.value)}
                  className="max-w-[120px]"
                />
              </div>
            ))}
          </div>

          {difference !== 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                The total results (${totalResults}) {difference > 0 ? "are less than" : "exceed"} the 
                total money in game (${totalMoneyInGame}) by ${Math.abs(difference)}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button 
              onClick={handleFinalize} 
              disabled={difference !== 0}
            >
              Finalize Game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
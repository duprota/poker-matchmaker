
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GamePlayer } from "@/types/game";
import { calculateTotalBuyInsAndRebuys } from "./GameCalculations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [results, setResults] = useState<Record<string, number>>({});
  const [updating, setUpdating] = useState(false);
  
  const totalMoneyInGame = calculateTotalBuyInsAndRebuys(players);
  const totalResults = Object.values(results).reduce((acc, val) => acc + (val || 0), 0);
  const difference = totalMoneyInGame - totalResults;
  
  const handleResultChange = (playerId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [playerId]: parseInt(value) || 0
    }));
  };

  const handleFinalize = async () => {
    if (difference !== 0) return;
    try {
      console.log("Starting game finalization...");
      setUpdating(true);

      // Update each player's final result
      for (const player of players) {
        console.log(`Updating final result for player ${player.id} to ${results[player.id]}`);
        const { error: updateError } = await supabase.from("game_players").update({
          final_result: results[player.id],
          payment_status: results[player.id] >= 0 ? 'pending' : 'pending'
        }).eq("id", player.id);
        if (updateError) throw updateError;

        // Add to game history
        const { error: historyError } = await supabase.from("game_history").insert({
          game_id: player.game_id,
          game_player_id: player.id,
          event_type: "result_update",
          amount: results[player.id]
        });
        if (historyError) throw historyError;
      }

      // Update game status to completed
      const { error: gameError } = await supabase.from("games").update({
        status: "completed"
      }).eq("id", players[0].game_id);
      if (gameError) throw gameError;
      
      console.log("Game finalization completed successfully");
      toast({
        title: "Success",
        description: "Game finalized successfully"
      });
      onFinalize(results);
      onClose();
    } catch (error) {
      console.error("Error finalizing game:", error);
      toast({
        title: "Error",
        description: "Failed to finalize game. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
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
      <DialogContent className={`${isMobile ? 'max-h-[90vh] w-[95vw] p-4' : 'max-w-2xl'}`}>
        <DialogHeader>
          <DialogTitle>Finalize Game</DialogTitle>
          <DialogDescription>
            Enter the final amount for each player. The total must match the money in game.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className={`${isMobile ? 'h-[60vh]' : 'max-h-[60vh]'} pr-4`}>
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">Total Money in Game: ${totalMoneyInGame}</p>
              <p className="text-sm text-muted-foreground mt-1">
                This includes all buy-ins and rebuys
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Final Results</h3>
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-4">
                  <span className={`${isMobile ? 'min-w-[100px]' : 'min-w-[150px]'} text-sm sm:text-base`}>
                    {player.player.name}
                  </span>
                  <input 
                    type="number" 
                    inputMode="numeric" 
                    pattern="[0-9]*" 
                    value={results[player.id] || ""} 
                    onChange={e => handleResultChange(player.id, e.target.value)} 
                    style={{
                      appearance: 'textfield',
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none'
                    }} 
                    className="max-w-[120px] h-12 border border-input px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md bg-transparent" 
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {difference !== 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              The total results (${totalResults}) {difference > 0 ? "are less than" : "exceed"} the 
              total money in game (${totalMoneyInGame}) by ${Math.abs(difference)}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4 sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose} className="h-12">
            Back
          </Button>
          <Button onClick={handleFinalize} disabled={difference !== 0 || updating} className="h-12">
            {updating ? "Finalizing..." : "Finalize Game"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

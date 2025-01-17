import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GamePlayer {
  id: string;
  player: {
    name: string;
    email: string;
  };
  initial_buyin: number;
  total_rebuys: number;
  final_result: number | null;
}

interface OngoingGameFormProps {
  players: GamePlayer[];
  rebuys: Record<string, number>;
  results: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onResultChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  onSaveResults: () => void;
  savingRebuys: boolean;
  savingResults: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
}

export const OngoingGameForm = ({
  players,
  rebuys,
  results,
  onRebuyChange,
  onResultChange,
  onSaveRebuys,
  onSaveResults,
  savingRebuys,
  savingResults,
  setRebuys,
}: OngoingGameFormProps) => {
  const handleSaveRebuys = () => {
    onSaveRebuys();
    // Reset rebuys after saving
    setRebuys({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Rebuys</h2>
        <div className="grid gap-4 mb-4">
          {players.map((gamePlayer) => (
            <div key={gamePlayer.id} className="flex items-center gap-4">
              <span className="min-w-[150px]">{gamePlayer.player.name}</span>
              <Input
                type="number"
                value={rebuys[gamePlayer.id] || 0}
                onChange={(e) => onRebuyChange(gamePlayer.id, e.target.value)}
                className="max-w-[120px]"
              />
            </div>
          ))}
        </div>
        <Button 
          onClick={handleSaveRebuys} 
          disabled={savingRebuys}
          className="w-full md:w-auto"
        >
          {savingRebuys ? "Saving..." : "Save Rebuys"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Final Results</h2>
        <div className="grid gap-4 mb-4">
          {players.map((gamePlayer) => (
            <div key={gamePlayer.id} className="flex items-center gap-4">
              <span className="min-w-[150px]">{gamePlayer.player.name}</span>
              <Input
                type="number"
                value={results[gamePlayer.id] || 0}
                onChange={(e) => onResultChange(gamePlayer.id, e.target.value)}
                className="max-w-[120px]"
              />
            </div>
          ))}
        </div>
        <Button 
          onClick={onSaveResults} 
          disabled={savingResults}
          className="w-full md:w-auto"
        >
          {savingResults ? "Saving..." : "Save Results"}
        </Button>
      </div>
    </div>
  );
};
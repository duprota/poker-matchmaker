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
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
}

export const OngoingGameForm = ({
  players,
  rebuys,
  onRebuyChange,
  onSaveRebuys,
  savingRebuys,
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
              <div className="flex-1 max-w-[200px]">
                <Input
                  type="number"
                  value={rebuys[gamePlayer.id] || 0}
                  onChange={(e) => onRebuyChange(gamePlayer.id, e.target.value)}
                  className="max-w-[120px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Total: ${(rebuys[gamePlayer.id] || 0) * gamePlayer.initial_buyin}
                </p>
              </div>
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
    </div>
  );
};
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

export interface OngoingGameFormProps {
  players: any[];
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
  const { toast } = useToast();

  const handleSaveRebuys = () => {
    onSaveRebuys();
    setRebuys({});
  };

  const handleQuickRebuy = (playerId: string) => {
    console.log("Quick rebuy clicked for player:", playerId);
    const currentRebuys = Number(rebuys[playerId] || 0);
    const newValue = currentRebuys + 1;
    console.log("Current rebuys:", currentRebuys, "New value:", newValue);
    onRebuyChange(playerId, String(newValue));
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Rebuys</h2>
        <div className="grid gap-4 mb-4">
          {players.map((gamePlayer) => (
            <div key={gamePlayer.id} className="flex items-center gap-4">
              <span className="min-w-[150px]">{gamePlayer.player.name}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={rebuys[gamePlayer.id] || 0}
                  onChange={(e) => onRebuyChange(gamePlayer.id, e.target.value)}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuickRebuy(gamePlayer.id)}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground ml-4">
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
    </Card>
  );
};
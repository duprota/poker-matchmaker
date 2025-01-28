import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  return (
    <Card className="p-6 space-y-6">
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
    </Card>
  );
};
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { PlayerGameCard } from "./PlayerGameCard";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CashOutOverrides } from "@/hooks/cashOutState";
export interface OngoingGameFormProps {
  players: any[];
  rebuys: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
  onOptimisticRebuy?: (gamePlayerId: string, value: number | null) => void;
  onCashOutSave: (id: string, value: number, persist: () => Promise<void>) => Promise<void>;
  cashOutOverrides: CashOutOverrides;
  onRemovePlayer?: (playerId: string) => void;
  onAddPlayer?: () => void;
}
export const OngoingGameForm = ({
  players,
  onOptimisticRebuy,
  onCashOutSave,
  cashOutOverrides,
  onRemovePlayer,
  onAddPlayer
}: OngoingGameFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const sortedPlayers = [...players].sort((a, b) => a.player.name.localeCompare(b.player.name));
  const filteredPlayers = sortedPlayers.filter(player => player.player.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    // Optimistic: update the shared local state immediately so the counter,
    // Total in Play and money flow chart all update together on click
    onOptimisticRebuy?.(playerId, newRebuys);
    try {
      const player = players.find(p => p.id === playerId);
      const previousRebuys = player?.total_rebuys ?? 0;
      const {
        error
      } = await supabase.from("game_players").update({
        total_rebuys: newRebuys
      }).eq("id", playerId);
      if (error) throw error;

      // Record the rebuy event in game history (fire-and-forget, never blocks the click)
      const delta = newRebuys - previousRebuys;
      if (player && delta !== 0) {
        supabase.from("game_history").insert({
          game_id: player.game_id,
          game_player_id: playerId,
          player_id: player.player_id,
          event_type: "rebuy" as const,
          amount: delta,
        }).then(({ error: historyError }) => {
          if (historyError) console.error("Error recording rebuy history:", historyError);
        });
      }
    } catch (error) {
      console.error("Error updating rebuys:", error);
      // Rollback: clear the override so the confirmed server value shows again
      onOptimisticRebuy?.(playerId, null);
      toast.error("Erro ao atualizar rebuys");
    }
  };

  const handleCashOut = async (playerId: string, finalStack: number) => {
    await onCashOutSave(playerId, finalStack, async () => {
      const player = players.find(p => p.id === playerId);
      if (!player) throw new Error("Player not found");

      const { data, error } = await supabase
        .from("game_players")
        .update({ final_result: finalStack })
        .eq("id", playerId)
        .select("id, final_result")
        .single();
      if (error) throw error;
      if (!data || data.final_result !== finalStack) throw new Error("Cashout not confirmed");

      // Record in game history
      void supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: playerId,
          event_type: "result_update" as const,
          amount: finalStack,
        }).then(({ error: historyError }) => {
          if (historyError) {
            console.error("Error recording history:", historyError);
            toast.error("Saída salva, mas houve erro ao registrar o histórico");
          }
        });
    });
  };
  useEffect(() => {
    const gameId = players[0]?.game_id;
    if (!gameId) return;
    const channel = supabase.channel('game-players-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_players',
      filter: `game_id=eq.${gameId}`
    }, payload => {
      console.log('Real-time update received:', payload);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [players]);
  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const item = {
    hidden: {
      y: 20,
      opacity: 0
    },
    show: {
      y: 0,
      opacity: 1
    }
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text flex-grow">
          Mesa de Jogo
        </h2>
        
        <div className="flex items-center gap-4">
          {onAddPlayer && <Button onClick={onAddPlayer} className="gap-2">+ Jogador</Button>}
        </div>
      </div>
      
      <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
        {filteredPlayers.map(gamePlayer => <motion.div key={gamePlayer.id} variants={item}>
            <PlayerGameCard player={gamePlayer} onRemovePlayer={onRemovePlayer} onRebuyChange={handleRebuyChange} onCashOut={handleCashOut} isProcessing={cashOutOverrides[gamePlayer.id]?.saving ?? false} />
          </motion.div>)}
      </motion.div>
      
      {filteredPlayers.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum jogador encontrado</h3>
          <p className="text-muted-foreground">
            Tente buscar com outro termo ou verifique se há jogadores na mesa.
          </p>
        </div>}
    </div>;
};
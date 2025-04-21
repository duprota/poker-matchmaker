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
export interface OngoingGameFormProps {
  players: any[];
  rebuys: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
  onRemovePlayer?: (playerId: string) => void;
  onAddPlayer?: () => void;
}
export const OngoingGameForm = ({
  players,
  onRemovePlayer,
  onAddPlayer
}: OngoingGameFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const sortedPlayers = [...players].sort((a, b) => a.player.name.localeCompare(b.player.name));
  const filteredPlayers = sortedPlayers.filter(player => player.player.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    setIsProcessing(true);
    try {
      const {
        error
      } = await supabase.from("game_players").update({
        total_rebuys: newRebuys
      }).eq("id", playerId);
      if (error) throw error;
      toast.success("Rebuys atualizados com sucesso!");
    } catch (error) {
      console.error("Error updating rebuys:", error);
      toast.error("Erro ao atualizar rebuys");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSpecialHandsChange = async (playerId: string, specialHands: {
    [key: string]: number;
  }) => {
    setIsProcessing(true);
    try {
      const {
        error
      } = await supabase.from("game_players").update({
        special_hands: specialHands
      }).eq("id", playerId);
      if (error) throw error;
      toast.success("Mãos especiais atualizadas com sucesso!");
    } catch (error) {
      console.error("Error updating special hands:", error);
      toast.error("Erro ao atualizar mãos especiais");
    } finally {
      setIsProcessing(false);
    }
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
            <PlayerGameCard player={gamePlayer} onRemovePlayer={onRemovePlayer} onRebuyChange={handleRebuyChange} onSpecialHandsChange={handleSpecialHandsChange} isProcessing={isProcessing} />
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
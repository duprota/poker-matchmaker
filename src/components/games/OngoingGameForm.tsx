
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { GameStatus } from "@/types/game";
import { PlayerGameCard } from "./PlayerGameCard";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface OngoingGameFormProps {
  players: any[];
  rebuys: Record<string, number>;
  onRebuyChange: (playerId: string, value: string) => void;
  onSaveRebuys: () => void;
  savingRebuys: boolean;
  setRebuys: (rebuys: Record<string, number>) => void;
  onRemovePlayer?: (playerId: string) => void;
}

export const OngoingGameForm = ({
  players,
  onRemovePlayer,
}: OngoingGameFormProps) => {
  const { toast } = useToast();
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sort players by name
  const sortedPlayers = [...players].sort((a, b) => 
    a.player.name.localeCompare(b.player.name)
  );

  // Filter players by search term
  const filteredPlayers = sortedPlayers.filter(player => 
    player.player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRebuyChange = async (playerId: string, newRebuys: number) => {
    try {
      setUpdatingPlayer(playerId);

      const { error: updateError } = await supabase
        .from("game_players")
        .update({ total_rebuys: newRebuys })
        .eq("id", playerId);

      if (updateError) throw updateError;

      // Find the player in the current list
      const player = players.find(p => p.id === playerId);
      if (!player) {
        throw new Error("Player not found");
      }
      
      // Add entry to game history
      const { error: historyError } = await supabase
        .from("game_history")
        .insert({
          game_id: player.game_id,
          game_player_id: playerId,
          event_type: "rebuy",
          amount: newRebuys
        });

      if (historyError) throw historyError;
      
      toast({
        title: "Rebuy registrado!",
        description: "Alteração salva com sucesso",
      });

      // We'll refresh only the affected player instead of the whole page
      // window.location.reload(); 
      
    } catch (error) {
      console.error("Error updating rebuys:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o rebuy. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPlayer(null);
    }
  };

  const handleSpecialHandUpdate = async (playerId: string, specialHands: { [key: string]: number }) => {
    try {
      setUpdatingPlayer(playerId);

      const { error } = await supabase
        .from("game_players")
        .update({ special_hands: specialHands })
        .eq("id", playerId);

      if (error) throw error;
      
      toast({
        title: "Mãos registradas!",
        description: "Jogadas especiais salvas com sucesso",
      });
      
    } catch (error) {
      console.error("Error updating special hands:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar as mãos especiais. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPlayer(null);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
          Mesa de Jogo
        </h2>
        
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Buscar jogador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-[220px] rounded-full bg-background border-muted"
          />
        </div>
      </div>
      
      <motion.div 
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredPlayers.map((gamePlayer) => (
          <motion.div key={gamePlayer.id} variants={item}>
            <PlayerGameCard
              player={gamePlayer}
              onRebuyChange={handleRebuyChange}
              onSpecialHandsChange={handleSpecialHandUpdate}
              onRemovePlayer={onRemovePlayer}
              isProcessing={updatingPlayer === gamePlayer.id}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {filteredPlayers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum jogador encontrado</h3>
          <p className="text-muted-foreground">
            Tente buscar com outro termo ou verifique se há jogadores na mesa.
          </p>
        </div>
      )}
    </div>
  );
};

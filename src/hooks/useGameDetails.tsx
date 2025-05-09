
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Game, GamePlayer } from "@/types/game";

export const useGameDetails = (gameId: string | undefined) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBalanceError, setHasBalanceError] = useState(false);
  const { toast } = useToast();

  const fetchGame = async () => {
    try {
      console.log("Fetching game details for ID:", gameId);
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();

      if (gameError || !gameData) throw gameError ?? new Error("Game not found");

      const { data: playersData, error: playersError } = await supabase
        .from("game_players")
        .select(`
          id,
          game_id,
          initial_buyin,
          total_rebuys,
          final_result,
          payment_status,
          payment_amount,
          special_hands,
          player:players (
            id,
            name,
            email
          )
        `)
        .eq("game_id", gameId);

      if (playersError || !playersData) throw playersError ?? new Error("Players not found");

      console.log("Game data:", gameData);
      console.log("Players data:", playersData);

      const gameWithPlayers: Game = {
        ...gameData,
        status: gameData.status,
        players: (playersData as GamePlayer[]).map((p) => ({
          ...p,
          special_hands: p.special_hands ?? {}, // Ensure special_hands is at least an empty object
        })),
      };

      setGame(gameWithPlayers);

      // Check balance after setting game data
      const totalBuyIns = playersData.reduce((acc, player: any) =>
        acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin), 0);
      const totalResults = playersData.reduce((acc, player: any) =>
        acc + (player.final_result || 0), 0);
      setHasBalanceError(totalBuyIns !== totalResults);

    } catch (error) {
      console.error("Error fetching game:", error);
      toast({
        title: "Error",
        description: "Failed to load game details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGame();

      // Subscribe to real-time updates for game_players table
      const channel = supabase
        .channel('game-player-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_players',
            filter: `game_id=eq.${gameId}`
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            // Refresh game data when changes are detected
            fetchGame();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        channel.unsubscribe();
      };
    }
  }, [gameId]);

  const updatePlayerResult = async (playerId: string, newResult: number) => {
    try {
      console.log(`Updating result for player ${playerId} to ${newResult}`);
      
      const { error } = await supabase
        .from("game_players")
        .update({ final_result: newResult })
        .eq("id", playerId);

      if (error) throw error;

      setGame(prevGame => {
        if (!prevGame) return null;
        return {
          ...prevGame,
          players: prevGame.players.map(player =>
            player.id === playerId
              ? { ...player, final_result: newResult }
              : player
          )
        };
      });

      toast({
        title: "Success",
        description: "Result updated successfully",
      });
    } catch (error) {
      console.error("Error updating result:", error);
      toast({
        title: "Error",
        description: "Failed to update result",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (playerId: string, status: string) => {
    try {
      console.log(`Updating payment status for player ${playerId} to ${status}`);
      
      const { error } = await supabase
        .from("game_players")
        .update({ payment_status: status })
        .eq("id", playerId);

      if (error) throw error;

      setGame(prevGame => {
        if (!prevGame) return null;
        return {
          ...prevGame,
          players: prevGame.players.map(player =>
            player.id === playerId
              ? { ...player, payment_status: status }
              : player
          )
        };
      });

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const updateSpecialHands = async (playerId: string, specialHands: { [key: string]: number }) => {
    try {
      console.log(`Updating special hands for player ${playerId}`, specialHands);
      
      const { error } = await supabase
        .from("game_players")
        .update({ special_hands: specialHands })
        .eq("id", playerId);

      if (error) throw error;

      setGame(prevGame => {
        if (!prevGame) return null;
        return {
          ...prevGame,
          players: prevGame.players.map(player =>
            player.id === playerId
              ? { ...player, special_hands: specialHands }
              : player
          )
        };
      });

      toast({
        title: "Success",
        description: "Special hands updated successfully",
      });
    } catch (error) {
      console.error("Error updating special hands:", error);
      toast({
        title: "Error",
        description: "Failed to update special hands",
        variant: "destructive",
      });
    }
  };

  return {
    game,
    loading,
    hasBalanceError,
    updatePlayerResult,
    updatePaymentStatus,
    updateSpecialHands,
    refreshGame: fetchGame
  };
};

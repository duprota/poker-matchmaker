import { Game, GamePlayer } from "@/types/game";
import { OngoingGameForm } from "./OngoingGameForm";
import { GameMoneyFlowChart } from "./GameMoneyFlowChart";
import { GameSummary } from "./GameSummary";
import { LiveProbabilityPanel } from "./LiveProbabilityPanel";
import { LiveScoresChart } from "./LiveScoresChart";
import { PreGameLobby } from "./PreGameLobby";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useOptimisticCashOut } from "@/hooks/useOptimisticCashOut";

interface GameContainerProps {
  game: Game;
  refreshGame: () => Promise<void>;
}

export const GameContainer = ({
  game,
  refreshGame
}: GameContainerProps) => {
  const {
    toast
  } = useToast();
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const cashOut = useOptimisticCashOut(game.id, game.players || []);
  const [liveRefreshVersion, setLiveRefreshVersion] = useState(0);

  const handleCashOut = async (id: string, value: number, persist: () => Promise<void>) => {
    await cashOut.save(id, value, persist);
    setLiveRefreshVersion(previous => previous + 1);
    await refreshGame();
  };

  // Optimistic rebuy overrides: local state is the source of truth on screen,
  // the server confirms in the background. Cleared when server data catches up.
  const [rebuyOverrides, setRebuyOverrides] = useState<Record<string, number>>({});

  const setRebuyOverride = (gamePlayerId: string, value: number | null) => {
    setRebuyOverrides(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[gamePlayerId];
      } else {
        next[gamePlayerId] = value;
      }
      return next;
    });
  };

  // Clear each override once the server value matches it (confirmation received)
  useEffect(() => {
    if (!game?.players) return;
    setRebuyOverrides(prev => {
      const entries = Object.entries(prev);
      if (entries.length === 0) return prev;
      let changed = false;
      const next = { ...prev };
      for (const [gpId, value] of entries) {
        const serverPlayer = game.players.find(p => p.id === gpId);
        if (serverPlayer && serverPlayer.total_rebuys === value) {
          delete next[gpId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [game?.players]);

  // Players with optimistic overrides applied — used by ALL displays
  // (cards, Total in Play, money flow chart) so everything updates together
  const displayPlayers = cashOut.players.map(p =>
    rebuyOverrides[p.id] !== undefined ? { ...p, total_rebuys: rebuyOverrides[p.id] } : p
  );

  // Note: realtime updates for game_players are handled (debounced) in
  // useGameDetails — no duplicate subscription needed here.

  const fetchPlayers = async () => {
    try {
      console.log("Fetching available players...");
      const {
        data,
        error
      } = await supabase.from("players").select("*").order("name");
      if (error) throw error;

      // Filter out players already in the game
      const availablePlayers = data?.filter(player => !game.players.some(gp => gp.player.id === player.id));
      console.log("Available players:", availablePlayers);
      setPlayers(availablePlayers || []);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        description: "Failed to load players",
        variant: "destructive"
      });
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      toast({
        description: "Please select a player",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsProcessing(true);
      console.log("Adding player to game:", selectedPlayer);

      // Definir o valor de buy-in igual aos demais jogadores do jogo
      let initialBuyin = 100;
      if (game.players.length > 0) {
        initialBuyin = game.players[0]?.initial_buyin || 100;
      }

      // Add player to game
      const {
        error: gamePlayerError
      } = await supabase.from("game_players").insert({
        game_id: game.id,
        player_id: selectedPlayer.id,
        initial_buyin: initialBuyin,
        total_rebuys: 0
      });
      if (gamePlayerError) throw gamePlayerError;

      // Trigger live scores recalculation immediately for new player
      if (game.status === "ongoing") {
        supabase.functions.invoke("calculate-live-scores", {
          body: { game_id: game.id },
        }).catch((err) => console.error("Error recalculating live scores:", err));
      }

      toast({
        description: "Player added successfully"
      });
      setShowAddPlayerDialog(false);
      setSelectedPlayer(null);
      refreshGame();
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        description: "Failed to add player",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      console.log("Removing player from game:", playerId);
      const {
        error
      } = await supabase.from("game_players").delete().eq("id", playerId);
      if (error) throw error;
      toast({
        description: "Player removed successfully"
      });
      refreshGame();
    } catch (error) {
      console.error("Error removing player:", error);
      toast({
        description: "Failed to remove player",
        variant: "destructive"
      });
    }
  };

  if (game.status === "completed") {
    return (
      <div className="grid gap-8">
        <GameSummary players={game.players} gameHistory={[]} date={game.date} name={game.name} place={game.place} startedAt={game.started_at} gameId={game.id} />
        <LiveScoresChart gameId={game.id} />
      </div>
    );
  }

  // Permitir adicionar jogadores nos status "created" e "ongoing"
  const allowAddingPlayers = game.status === "created" || game.status === "ongoing";
  return <div className="grid gap-8">
      {allowAddingPlayers && <div className="flex justify-between items-center">
          
          
        </div>}

      <div className="grid gap-4">
        {game.status === "ongoing" && <OngoingGameForm players={displayPlayers} rebuys={{}} onRebuyChange={() => {
        console.log("Rebuy change detected");
      }} onSaveRebuys={() => {
        console.log("Rebuys saved");
      }} savingRebuys={false} setRebuys={() => {
        console.log("Rebuys updated");
      }} onOptimisticRebuy={setRebuyOverride} onCashOutSave={handleCashOut} cashOutOverrides={cashOut.overrides} onRemovePlayer={handleRemovePlayer} onAddPlayer={() => {
        setShowAddPlayerDialog(true);
        fetchPlayers();
      }} />}

        {game.status === "created" && (
          <PreGameLobby
            game={game}
            onAddPlayer={() => {
              setShowAddPlayerDialog(true);
              fetchPlayers();
            }}
            onRemovePlayer={handleRemovePlayer}
          />
        )}
      </div>

      {game.status === "ongoing" && <LiveProbabilityPanel gameId={game.id} gameStatus={game.status} players={displayPlayers} cashOutOverrides={cashOut.overrides} refreshVersion={liveRefreshVersion} />}

      {game.status !== "created" && <GameMoneyFlowChart players={displayPlayers} gameHistory={[]} />}

      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Jogador</DialogTitle>
            <DialogDescription>
              Selecione um jogador para adicionar ao jogo.<br />
              O buy-in será igual ao dos outros jogadores já no jogo.
            </DialogDescription>
          </DialogHeader>

          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Buscar jogadores..." />
            <CommandList>
              <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
              <CommandGroup>
                {players?.map(player => <CommandItem key={player.id} onSelect={() => setSelectedPlayer(player)} className="cursor-pointer">
                    <div className={`flex flex-col ${selectedPlayer?.id === player.id ? 'text-primary' : ''}`}>
                      <span className="font-medium">{player.name}</span>
                      {player.email && <span className="text-sm text-muted-foreground">{player.email}</span>}
                    </div>
                  </CommandItem>)}
              </CommandGroup>
            </CommandList>
          </Command>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => {
            setShowAddPlayerDialog(false);
            setSelectedPlayer(null);
          }}>
              Cancelar
            </Button>
            <Button onClick={handleAddPlayer} disabled={isProcessing || !selectedPlayer}>
              {isProcessing ? "Adicionando..." : "Adicionar Jogador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

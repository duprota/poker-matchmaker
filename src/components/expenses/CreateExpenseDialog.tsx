import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useGamePlayers } from "@/hooks/useGamePlayers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CreateExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateExpenseDialog = ({ open, onOpenChange }: CreateExpenseDialogProps) => {
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidByPlayerId, setPaidByPlayerId] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [equalSplit, setEqualSplit] = useState(true);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const createExpense = useCreateExpense();

  // Fetch all players
  const { data: allPlayers = [] } = useQuery({
    queryKey: ["all-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch completed games for optional linking
  const { data: games = [] } = useQuery({
    queryKey: ["games-for-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, name, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch game players when a game is selected
  const { data: gamePlayers = [] } = useGamePlayers(gameId);

  // Players available for selection
  const availablePlayers = useMemo(() => {
    if (gameId && gamePlayers.length > 0) {
      return gamePlayers.map((gp) => ({ id: gp.playerId, name: gp.playerName }));
    }
    return allPlayers;
  }, [gameId, gamePlayers, allPlayers]);

  // Reset selected players when game changes
  useEffect(() => {
    setSelectedPlayers([]);
    setCustomAmounts({});
  }, [gameId]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAll = () => {
    setSelectedPlayers(availablePlayers.map((p) => p.id));
  };

  const amount = parseFloat(totalAmount) || 0;
  const equalShare = selectedPlayers.length > 0
    ? Number((amount / selectedPlayers.length).toFixed(2))
    : 0;

  const splits = useMemo(() => {
    if (equalSplit) {
      return selectedPlayers.map((pid) => ({ player_id: pid, amount: equalShare }));
    }
    return selectedPlayers.map((pid) => ({
      player_id: pid,
      amount: parseFloat(customAmounts[pid] || "0"),
    }));
  }, [equalSplit, selectedPlayers, equalShare, customAmounts]);

  const customTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValid =
    description.trim() &&
    amount > 0 &&
    paidByPlayerId &&
    selectedPlayers.length > 0 &&
    (equalSplit || Math.abs(customTotal - amount) < 0.02);

  const handleSubmit = () => {
    if (!isValid) return;
    createExpense.mutate(
      {
        description,
        total_amount: amount,
        paid_by_player_id: paidByPlayerId,
        game_id: gameId,
        splits,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setDescription("");
    setTotalAmount("");
    setPaidByPlayerId("");
    setGameId(null);
    setSelectedPlayers([]);
    setEqualSplit(true);
    setCustomAmounts({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Pizza e bebidas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Total amount */}
          <div className="space-y-1">
            <Label>Valor total (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          {/* Paid by */}
          <div className="space-y-1">
            <Label>Pago por</Label>
            <Select value={paidByPlayerId} onValueChange={setPaidByPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione quem pagou" />
              </SelectTrigger>
              <SelectContent>
                {allPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional game */}
          <div className="space-y-1">
            <Label>Vincular a jogo (opcional)</Label>
            <Select
              value={gameId ?? "none"}
              onValueChange={(v) => setGameId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum jogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {games.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name || new Date(g.date).toLocaleDateString("pt-BR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Participantes</Label>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAll}>
                Selecionar todos
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availablePlayers.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedPlayers.includes(p.id)}
                    onCheckedChange={() => togglePlayer(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>

          {/* Split mode */}
          {selectedPlayers.length > 0 && amount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={equalSplit} onCheckedChange={setEqualSplit} />
                <Label className="text-sm">
                  {equalSplit ? "Divisão igual" : "Valores customizados"}
                </Label>
              </div>

              {equalSplit ? (
                <p className="text-sm text-muted-foreground">
                  R$ {equalShare.toFixed(2)} por pessoa ({selectedPlayers.length} participantes)
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPlayers.map((pid) => {
                    const player = availablePlayers.find((p) => p.id === pid);
                    return (
                      <div key={pid} className="flex items-center gap-2">
                        <span className="text-sm min-w-[80px] truncate">
                          {player?.name}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          className="h-8"
                          value={customAmounts[pid] ?? ""}
                          onChange={(e) =>
                            setCustomAmounts((prev) => ({
                              ...prev,
                              [pid]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                  <p className={`text-xs ${Math.abs(customTotal - amount) < 0.02 ? "text-muted-foreground" : "text-destructive"}`}>
                    Total: R$ {customTotal.toFixed(2)} / R$ {amount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!isValid || createExpense.isPending}
            onClick={handleSubmit}
          >
            {createExpense.isPending ? "Salvando..." : "Registrar Despesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

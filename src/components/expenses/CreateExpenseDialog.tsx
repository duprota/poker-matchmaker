import { useState, useMemo, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Check, Users } from "lucide-react";

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

  const { data: gamePlayers = [] } = useGamePlayers(gameId);

  const availablePlayers = useMemo(() => {
    if (gameId && gamePlayers.length > 0) {
      return gamePlayers.map((gp) => ({ id: gp.playerId, name: gp.playerName }));
    }
    return allPlayers;
  }, [gameId, gamePlayers, allPlayers]);

  // Also filter "paid by" based on game selection
  const payerOptions = useMemo(() => {
    if (gameId && gamePlayers.length > 0) {
      return gamePlayers.map((gp) => ({ id: gp.playerId, name: gp.playerName }));
    }
    return allPlayers;
  }, [gameId, gamePlayers, allPlayers]);

  useEffect(() => {
    setSelectedPlayers([]);
    setPaidByPlayerId("");
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="bg-gradient-to-r from-primary via-secondary-foreground to-accent-foreground bg-clip-text text-transparent">
            New Expense
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 space-y-5 pb-2">
          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="e.g. Pizza & drinks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Total amount */}
          <div className="space-y-1.5">
            <Label>Total amount (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          {/* Link to game — MOVED UP */}
          <div className="space-y-1.5">
            <Label>Link to game (optional)</Label>
            <Select
              value={gameId ?? "none"}
              onValueChange={(v) => setGameId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {games.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name || new Date(g.date).toLocaleDateString("en-US")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid by — NOW AFTER game selection, filtered */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <Select value={paidByPlayerId} onValueChange={setPaidByPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {payerOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participants — clickable cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Participants
              </Label>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAll}>
                Select all
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              {availablePlayers.map((p) => {
                const isSelected = selectedPlayers.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all duration-150 text-sm font-medium ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card hover:bg-accent border border-border"
                    }`}
                  >
                    {p.name}
                    {isSelected && (
                      <Check className="absolute top-2 right-2 w-3.5 h-3.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split section */}
          {selectedPlayers.length > 0 && amount > 0 && (
            <div className="space-y-3 rounded-lg border border-border p-3 bg-card">
              <div className="flex items-center gap-2">
                <Switch checked={equalSplit} onCheckedChange={setEqualSplit} />
                <Label className="text-sm font-medium">
                  {equalSplit ? "Equal split" : "Custom amounts"}
                </Label>
              </div>

              {equalSplit ? (
                <p className="text-sm text-muted-foreground">
                  R$ {equalShare.toFixed(2)} per person ({selectedPlayers.length} participant{selectedPlayers.length > 1 ? "s" : ""})
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
                  <p className={`text-xs font-medium ${Math.abs(customTotal - amount) < 0.02 ? "text-muted-foreground" : "text-destructive"}`}>
                    Total: R$ {customTotal.toFixed(2)} / R$ {amount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            className="w-full"
            disabled={!isValid || createExpense.isPending}
            onClick={handleSubmit}
          >
            {createExpense.isPending ? "Saving..." : "Create Expense"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

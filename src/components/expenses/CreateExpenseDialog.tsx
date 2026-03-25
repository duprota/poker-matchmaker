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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useGamePlayers } from "@/hooks/useGamePlayers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Check, Users, Equal, Percent, LayoutGrid, DollarSign } from "lucide-react";

type SplitMode = "equal" | "percentage" | "parts" | "direct";

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
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [totalParts, setTotalParts] = useState("");

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

  // Reset custom inputs when split mode changes
  useEffect(() => {
    setCustomAmounts({});
    setTotalParts("");
  }, [splitMode]);

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

  const totalPartsNumber = parseFloat(totalParts) || 0;

  const splits = useMemo(() => {
    if (splitMode === "equal") {
      return selectedPlayers.map((pid) => ({ player_id: pid, amount: equalShare }));
    }
    if (splitMode === "percentage") {
      return selectedPlayers.map((pid) => {
        const pct = parseFloat(customAmounts[pid] || "0");
        return { player_id: pid, amount: Number((amount * pct / 100).toFixed(2)) };
      });
    }
    if (splitMode === "parts") {
      const assignedParts = selectedPlayers.reduce(
        (sum, pid) => sum + (parseFloat(customAmounts[pid] || "0") || 0), 0
      );
      const divisor = totalPartsNumber > 0 ? totalPartsNumber : (assignedParts > 0 ? assignedParts : 1);
      return selectedPlayers.map((pid) => {
        const playerParts = parseFloat(customAmounts[pid] || "0") || 0;
        return { player_id: pid, amount: Number((amount * playerParts / divisor).toFixed(2)) };
      });
    }
    // direct
    return selectedPlayers.map((pid) => ({
      player_id: pid,
      amount: parseFloat(customAmounts[pid] || "0"),
    }));
  }, [splitMode, selectedPlayers, equalShare, customAmounts, amount, totalPartsNumber]);

  const customTotal = splits.reduce((sum, s) => sum + s.amount, 0);

  // Validation per mode
  const splitValidation = useMemo(() => {
    if (splitMode === "equal") return { valid: true, message: "" };

    if (splitMode === "percentage") {
      const pctSum = selectedPlayers.reduce(
        (sum, pid) => sum + (parseFloat(customAmounts[pid] || "0") || 0), 0
      );
      const valid = Math.abs(pctSum - 100) < 0.1;
      return {
        valid,
        message: `Total: ${pctSum.toFixed(1)}% / 100%`,
      };
    }

    if (splitMode === "parts") {
      const assignedParts = selectedPlayers.reduce(
        (sum, pid) => sum + (parseFloat(customAmounts[pid] || "0") || 0), 0
      );
      if (totalPartsNumber <= 0) {
        return { valid: false, message: "Informe o total de partes" };
      }
      const valid = assignedParts > 0 && Math.abs(assignedParts - totalPartsNumber) < 0.1;
      return {
        valid,
        message: `Atribuídas: ${assignedParts} / ${totalPartsNumber} partes`,
      };
    }

    // direct
    const valid = Math.abs(customTotal - amount) < 0.02;
    return {
      valid,
      message: `Total: R$ ${customTotal.toFixed(2)} / R$ ${amount.toFixed(2)}`,
    };
  }, [splitMode, selectedPlayers, customAmounts, customTotal, amount, totalPartsNumber]);

  const isValid =
    description.trim() &&
    amount > 0 &&
    paidByPlayerId &&
    selectedPlayers.length > 0 &&
    splitValidation.valid;

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
    setSplitMode("equal");
    setCustomAmounts({});
    setTotalParts("");
  };

  const getInputSuffix = (mode: SplitMode) => {
    if (mode === "percentage") return "%";
    if (mode === "parts") return "partes";
    return "";
  };

  const renderSplitInputs = () => {
    if (splitMode === "equal") {
      return (
        <p className="text-sm text-muted-foreground">
          R$ {equalShare.toFixed(2)} por pessoa ({selectedPlayers.length} participante{selectedPlayers.length > 1 ? "s" : ""})
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {/* Total parts input for parts mode */}
        {splitMode === "parts" && (
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Label className="text-sm min-w-[80px]">Total partes</Label>
            <Input
              type="number"
              inputMode="numeric"
              className="h-8"
              placeholder="ex: 10"
              value={totalParts}
              onChange={(e) => setTotalParts(e.target.value)}
            />
          </div>
        )}

        {selectedPlayers.map((pid) => {
          const player = availablePlayers.find((p) => p.id === pid);
          const split = splits.find((s) => s.player_id === pid);
          const previewAmount = split?.amount ?? 0;

          return (
            <div key={pid} className="flex items-center gap-2">
              <span className="text-sm min-w-[70px] truncate">
                {player?.name}
              </span>
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  inputMode={splitMode === "parts" ? "numeric" : "decimal"}
                  step={splitMode === "direct" ? "0.01" : "1"}
                  className="h-8"
                  value={customAmounts[pid] ?? ""}
                  onChange={(e) =>
                    setCustomAmounts((prev) => ({
                      ...prev,
                      [pid]: e.target.value,
                    }))
                  }
                />
                {getInputSuffix(splitMode) && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {getInputSuffix(splitMode)}
                  </span>
                )}
              </div>
              {splitMode !== "direct" && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  → R$ {previewAmount.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}

        <p className={`text-xs font-medium ${splitValidation.valid ? "text-muted-foreground" : "text-destructive"}`}>
          {splitValidation.message}
        </p>
      </div>
    );
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

          {/* Link to game */}
          <div className="space-y-1.5">
            <Label>Link to game (optional)</Label>
            <Select
              value={gameId ?? "none"}
              onValueChange={(v) => setGameId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No game" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg [&_[role=option]]:bg-card" style={{ backgroundColor: 'hsl(222.2 84% 4.9%)' }}>
                <SelectItem value="none">None</SelectItem>
                {games.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name || new Date(g.date).toLocaleDateString("en-US")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paid by */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <Select value={paidByPlayerId} onValueChange={setPaidByPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg [&_[role=option]]:bg-card" style={{ backgroundColor: 'hsl(222.2 84% 4.9%)' }}>
                {payerOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participants */}
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
              {/* Split mode selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Modo de divisão</Label>
                <ToggleGroup
                  type="single"
                  value={splitMode}
                  onValueChange={(v) => v && setSplitMode(v as SplitMode)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="equal" aria-label="Igual" className="text-xs gap-1 px-2.5">
                    <Equal className="w-3.5 h-3.5" />
                    Igual
                  </ToggleGroupItem>
                  <ToggleGroupItem value="percentage" aria-label="Percentual" className="text-xs gap-1 px-2.5">
                    <Percent className="w-3.5 h-3.5" />
                    %
                  </ToggleGroupItem>
                  <ToggleGroupItem value="parts" aria-label="Partes" className="text-xs gap-1 px-2.5">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Partes
                  </ToggleGroupItem>
                  <ToggleGroupItem value="direct" aria-label="Valor direto" className="text-xs gap-1 px-2.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    R$
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {renderSplitInputs()}
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

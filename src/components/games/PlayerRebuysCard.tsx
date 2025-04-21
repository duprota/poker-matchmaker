import { useState } from "react";
import { Plus, Edit2, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { GamePlayer } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import { PlayerSpecialHandReaction, EmojiSVGDefs } from "./PlayerSpecialHandReaction";

interface PlayerRebuysCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  isUpdating: boolean;
  onRemovePlayer?: (playerId: string) => void;
}

export const PlayerRebuysCard = ({
  player,
  onRebuyChange,
  isUpdating,
  onRemovePlayer,
}: PlayerRebuysCardProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [specialHand, setSpecialHand] = useState(null);
  const { toast } = useToast();
  const totalAmount = player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickRebuy = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await onRebuyChange(player.id, player.total_rebuys + 1);
    } catch (error) {
      console.error("Error in quick rebuy:", error);
      toast({
        title: "Error",
        description: "Failed to process rebuy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRebuys = async (newValue: number) => {
    if (newValue < 0) {
      toast({
        title: "Invalid value",
        description: "Number of rebuys cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      await onRebuyChange(player.id, newValue);
      setShowHistory(false);
    } catch (error) {
      console.error("Error updating rebuys:", error);
      toast({
        title: "Error",
        description: "Failed to update rebuys",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRemovePlayer = () => {
    setShowRemoveConfirm(true);
  };

  const handleRemoveConfirmed = () => {
    if(onRemovePlayer) {
      onRemovePlayer(player.id);
    }
    setShowRemoveConfirm(false);
  };

  const handleRemoveCanceled = () => {
    setShowRemoveConfirm(false);
  };

  return (
    <>
      <EmojiSVGDefs />
      <Card className="p-4 hover:bg-accent/5 transition-colors">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{player.player.name}</h3>
              <PlayerSpecialHandReaction
                value={specialHand}
                onChange={setSpecialHand}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                disabled={isProcessing}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={handleQuickRebuy}
                disabled={isProcessing}
                size="sm"
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Rebuy
              </Button>
              {onRemovePlayer && (
                <Button
                  onClick={confirmRemovePlayer}
                  disabled={isProcessing}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remover jogador"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${totalAmount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rebuys</p>
              <p className="text-2xl font-bold">{player.total_rebuys}</p>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rebuys for {player.player.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={player.total_rebuys === value ? "default" : "outline"}
                  onClick={() => handleUpdateRebuys(value)}
                  disabled={isProcessing}
                >
                  {value}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Total amount with {player.total_rebuys} rebuys: ${totalAmount}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o jogador <strong>{player.player.name}</strong> do jogo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleRemoveCanceled}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemoveConfirmed}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

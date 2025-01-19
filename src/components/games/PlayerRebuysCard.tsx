import { useState } from "react";
import { Plus, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GamePlayer } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

interface PlayerRebuysCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => void;
}

export const PlayerRebuysCard = ({ player, onRebuyChange }: PlayerRebuysCardProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const totalAmount = player.initial_buyin + (player.total_rebuys * player.initial_buyin);

  const handleQuickRebuy = async () => {
    setIsUpdating(true);
    try {
      await onRebuyChange(player.id, player.total_rebuys + 1);
      toast({
        title: "Rebuy added",
        description: `Added 1 rebuy for ${player.player.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add rebuy",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRebuys = async (newValue: number) => {
    setIsUpdating(true);
    try {
      await onRebuyChange(player.id, newValue);
      setShowHistory(false);
      toast({
        title: "Rebuys updated",
        description: `Updated rebuys for ${player.player.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update rebuys",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className="p-4 hover:bg-accent/5 transition-colors">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{player.player.name}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={handleQuickRebuy}
                disabled={isUpdating}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Rebuy
              </Button>
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
                  disabled={isUpdating}
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
    </>
  );
};
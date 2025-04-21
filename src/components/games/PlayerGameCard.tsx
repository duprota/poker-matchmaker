
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2 } from "lucide-react";
import { PlayerSpecialHandReaction } from "./PlayerSpecialHandReaction";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { GamePlayer } from "@/types/game";

interface PlayerGameCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  onRemovePlayer?: (playerId: string) => void;
  isProcessing: boolean;
}

export function PlayerGameCard({
  player,
  onRebuyChange,
  onRemovePlayer,
  isProcessing
}: PlayerGameCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();
  const totalAmount = player.initial_buyin + (player.total_rebuys * player.initial_buyin);

  const handleQuickRebuy = async () => {
    if (isProcessing) return;
    await onRebuyChange(player.id, player.total_rebuys + 1);
  };

  const RebuyControls = () => (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Alterar Rebuys</h3>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <Button
            key={value}
            variant={player.total_rebuys === value ? "default" : "outline"}
            onClick={() => onRebuyChange(player.id, value)}
            disabled={isProcessing}
            className="h-12 text-lg"
          >
            {value}
          </Button>
        ))}
      </div>
    </div>
  );

  const CardContent = () => {
    const Control = isMobile ? Drawer : Sheet;
    const TriggerComponent = isMobile ? DrawerTrigger : SheetTrigger;
    const ContentComponent = isMobile ? DrawerContent : SheetContent;

    return (
      <Card className="bg-gradient-to-br from-zinc-900/40 to-zinc-900/20 backdrop-blur-sm border-white/10 p-4 hover:shadow-lg transition-all duration-200">
        <div className="space-y-4">
          {/* Header with name and actions */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gradient">{player.player.name}</h3>
            <div className="flex items-center gap-2">
              <Control>
                <TriggerComponent asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                </TriggerComponent>
                <ContentComponent>
                  <RebuyControls />
                </ContentComponent>
              </Control>
              
              <Button
                onClick={handleQuickRebuy}
                disabled={isProcessing}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Rebuy
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-gradient">${totalAmount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rebuys</p>
              <p className="text-2xl font-bold text-gradient">{player.total_rebuys}</p>
            </div>
          </div>

          {/* Special Hands */}
          <div className="flex justify-end pt-2">
            <PlayerSpecialHandReaction
              value={player.special_hands || {}}
              onChange={async (newHands) => {
                // Implementation handled by parent
              }}
            />
          </div>
        </div>
      </Card>
    );
  };

  return <CardContent />;
}


import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GamePlayer } from "@/types/game";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerStats } from "./PlayerStats";
import { PlayerActions } from "./PlayerActions";
import { EditRebuysDialog } from "./EditRebuysDialog";
import { EmojiSVGDefs } from "../PlayerSpecialHandReaction";

interface PlayerGameCardProps {
  player: GamePlayer;
  onRebuyChange: (playerId: string, newRebuys: number) => Promise<void>;
  onSpecialHandsChange: (playerId: string, specialHands: { [key: string]: number }) => Promise<void>;
  onRemovePlayer?: (playerId: string) => void;
  isProcessing: boolean;
}

export const PlayerGameCard = ({
  player,
  onRebuyChange,
  onSpecialHandsChange,
  onRemovePlayer,
  isProcessing
}: PlayerGameCardProps) => {
  const [showRebuys, setShowRebuys] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const totalAmount = player.initial_buyin + (player.total_rebuys * player.initial_buyin);

  const handleQuickRebuy = async () => {
    if (isProcessing) return;
    await onRebuyChange(player.id, player.total_rebuys + 1);
  };

  const handleUpdateRebuys = async (newValue: number) => {
    if (isProcessing) return;
    await onRebuyChange(player.id, newValue);
    setShowRebuys(false);
  };

  return (
    <>
      <EmojiSVGDefs />
      <Card className="p-4 hover:bg-accent/5 transition-colors">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlayerAvatar playerName={player.player.name} />
              <h3 className="font-semibold text-lg">{player.player.name}</h3>
            </div>
            <PlayerActions
              onEdit={() => setShowRebuys(true)}
              onQuickRebuy={handleQuickRebuy}
              onRemove={onRemovePlayer ? () => setShowRemoveConfirm(true) : undefined}
              isProcessing={isProcessing}
            />
          </div>

          <PlayerStats totalAmount={totalAmount} totalRebuys={player.total_rebuys} />
        </div>
      </Card>

      <EditRebuysDialog
        open={showRebuys}
        onOpenChange={setShowRebuys}
        playerName={player.player.name}
        currentRebuys={player.total_rebuys}
        totalAmount={totalAmount}
        onUpdateRebuys={handleUpdateRebuys}
        isProcessing={isProcessing}
      />

      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o jogador <strong>{player.player.name}</strong> do jogo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (onRemovePlayer) onRemovePlayer(player.id);
              setShowRemoveConfirm(false);
            }}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

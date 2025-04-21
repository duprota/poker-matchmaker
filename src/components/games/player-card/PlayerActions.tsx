
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Loader2, Trash2 } from "lucide-react";

interface PlayerActionsProps {
  onEdit: () => void;
  onQuickRebuy: () => void;
  onRemove?: () => void;
  isProcessing: boolean;
}

export const PlayerActions = ({ onEdit, onQuickRebuy, onRemove, isProcessing }: PlayerActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isProcessing}
        className="gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Edit
      </Button>
      <Button
        onClick={onQuickRebuy}
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
      {onRemove && (
        <Button
          onClick={onRemove}
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
  );
};

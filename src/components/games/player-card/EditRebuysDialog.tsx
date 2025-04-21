
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditRebuysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  currentRebuys: number;
  totalAmount: number;
  onUpdateRebuys: (value: number) => void;
  isProcessing: boolean;
}

export const EditRebuysDialog = ({
  open,
  onOpenChange,
  playerName,
  currentRebuys,
  totalAmount,
  onUpdateRebuys,
  isProcessing
}: EditRebuysDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Rebuys for {playerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant={currentRebuys === value ? "default" : "outline"}
                onClick={() => onUpdateRebuys(value)}
                disabled={isProcessing}
              >
                {value}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Total amount with {currentRebuys} rebuys: ${totalAmount}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

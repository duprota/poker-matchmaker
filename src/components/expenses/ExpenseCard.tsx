import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Utensils, Gamepad2 } from "lucide-react";
import { format } from "date-fns";
import type { ExpenseWithSplits } from "@/hooks/useExpenses";

interface ExpenseCardProps {
  expense: ExpenseWithSplits;
  onDelete: () => void;
}

export const ExpenseCard = ({ expense, onDelete }: ExpenseCardProps) => {
  const paidByName = expense.paid_by_player?.name ?? "Unknown";
  const date = format(new Date(expense.created_at), "MMM dd, yyyy");
  const gameName = expense.game
    ? expense.game.name || format(new Date(expense.game.date), "MMM dd, yyyy")
    : null;

  return (
    <Card className="hover-scale group transition-shadow hover:shadow-md border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
              <Utensils className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{expense.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paid by <span className="font-medium text-foreground">{paidByName}</span> · {date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-base tabular-nums">
              R$ {Number(expense.total_amount).toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {gameName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game: {gameName}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {expense.expense_splits.map((split) => (
            <span
              key={split.id}
              className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium"
            >
              {split.player?.name ?? "?"}: R$ {Number(split.amount).toFixed(2)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

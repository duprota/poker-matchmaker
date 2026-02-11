import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Utensils } from "lucide-react";
import { format } from "date-fns";
import type { ExpenseWithSplits } from "@/hooks/useExpenses";

interface ExpenseCardProps {
  expense: ExpenseWithSplits;
  onDelete: () => void;
}

export const ExpenseCard = ({ expense, onDelete }: ExpenseCardProps) => {
  const paidByName = expense.paid_by_player?.name ?? "Desconhecido";
  const date = format(new Date(expense.created_at), "dd/MM/yyyy");
  const gameName = expense.game
    ? expense.game.name || format(new Date(expense.game.date), "dd/MM/yyyy")
    : null;

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Utensils className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{expense.description}</p>
              <p className="text-xs text-muted-foreground">
                Pago por <span className="font-medium text-foreground">{paidByName}</span> · {date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-sm">
              R$ {Number(expense.total_amount).toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {gameName && (
          <p className="text-xs text-muted-foreground">
            🎮 Jogo: {gameName}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {expense.expense_splits.map((split) => (
            <span
              key={split.id}
              className="text-xs bg-muted px-2 py-0.5 rounded-full"
            >
              {split.player?.name ?? "?"}: R$ {Number(split.amount).toFixed(2)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

import { Navigation } from "@/components/Navigation";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { CreateExpenseDialog } from "@/components/expenses/CreateExpenseDialog";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Expenses = () => {
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteExpense.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-6 px-4 max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shared Expenses</h1>
            <p className="text-sm text-muted-foreground">Track and split costs with your group</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Receipt className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">No expenses yet</p>
            <p className="text-xs">Create your first shared expense to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <div
                key={expense.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ExpenseCard
                  expense={expense}
                  onDelete={() => setDeleteId(expense.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateExpenseDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the expense and adjust all participant balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;

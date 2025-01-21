import { Card } from "@/components/ui/card";
import { TransactionCard } from "./TransactionCard";

interface Transaction {
  from: string;
  to: string;
  amount: number;
  date: string;
  paymentStatus: string;
  toPixKey?: string;
  gamePlayerIds: string[];
}

interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  onMarkAsPaid: (gamePlayerIds: string[]) => Promise<void>;
  emptyMessage?: string;
}

export const TransactionList = ({
  title,
  transactions,
  onMarkAsPaid,
  emptyMessage = "No transactions to display.",
}: TransactionListProps) => {
  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">
        {title}
      </h2>
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <TransactionCard
                {...transaction}
                onMarkAsPaid={onMarkAsPaid}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
          <div className="text-center text-muted-foreground">
            {emptyMessage}
          </div>
        </Card>
      )}
    </div>
  );
};
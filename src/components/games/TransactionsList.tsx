import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface Player {
  id: string;
  player: {
    name: string;
  };
}

interface TransactionsListProps {
  transactions: Transaction[];
  players: Player[];
  onUpdatePaymentStatus: (playerId: string, status: string) => Promise<void>;
}

export const TransactionsList = ({
  transactions,
  players,
  onUpdatePaymentStatus,
}: TransactionsListProps) => {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.player.name || 'Unknown Player';
  };

  return (
    <Card className="mt-6 p-6">
      <h2 className="text-xl font-semibold mb-4">Payment Transactions</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell>{getPlayerName(transaction.from)}</TableCell>
              <TableCell>{getPlayerName(transaction.to)}</TableCell>
              <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => onUpdatePaymentStatus(transaction.from, 'paid')}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark as Paid
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
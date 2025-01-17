import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface GamePlayer {
  id: string;
  player: {
    name: string;
  };
  payment_status: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  players: GamePlayer[];
  onUpdatePaymentStatus: (playerId: string, status: string) => Promise<void>;
}

export const TransactionsList = ({ 
  transactions, 
  players,
  onUpdatePaymentStatus 
}: TransactionsListProps) => {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.player.name || 'Unknown Player';
  };

  const getPaymentStatus = (fromPlayerId: string) => {
    const player = players.find(p => p.id === fromPlayerId);
    return player?.payment_status || 'pending';
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Required Transactions</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell>{getPlayerName(transaction.from)}</TableCell>
              <TableCell>{getPlayerName(transaction.to)}</TableCell>
              <TableCell className="text-right">${transaction.amount}</TableCell>
              <TableCell className="capitalize">{getPaymentStatus(transaction.from)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdatePaymentStatus(
                    transaction.from,
                    getPaymentStatus(transaction.from) === 'pending' ? 'paid' : 'pending'
                  )}
                >
                  {getPaymentStatus(transaction.from) === 'pending' 
                    ? 'Mark as Paid' 
                    : 'Mark as Pending'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateOptimizedPayments } from "@/utils/paymentOptimization";
import { TransactionsList } from "./TransactionsList";
import { GamePlayer } from "@/types/game";

interface PaymentManagementProps {
  players: GamePlayer[];
  calculateFinalResult: (player: GamePlayer) => number;
  onUpdatePaymentStatus: (playerId: string, status: string) => Promise<void>;
}

export const PaymentManagement = ({
  players,
  calculateFinalResult,
  onUpdatePaymentStatus,
}: PaymentManagementProps) => {
  const getPaymentInstructions = (finalResult: number) => {
    if (finalResult > 0) return "To Receive";
    if (finalResult < 0) return "To Pay";
    return "No Payment Needed";
  };

  // Format players data for transaction calculation
  const formattedPlayers = players.map(player => ({
    id: player.id,
    game_id: player.game_id,
    player: {
      id: player.player.id,
      name: player.player.name,
      email: player.player.email
    },
    initial_buyin: player.initial_buyin,
    total_rebuys: player.total_rebuys,
    final_result: calculateFinalResult(player),
    payment_status: player.payment_status,
    payment_amount: player.payment_amount
  }));

  // Calculate transactions using the optimization function
  const transactions = calculateOptimizedPayments([{
    id: formattedPlayers[0]?.game_id || '',
    date: new Date().toISOString(),
    name: null,
    status: 'completed',
    players: formattedPlayers
  }]).map(t => ({
    from: players.find(p => p.player.id === t.fromPlayer.id)?.id || '',
    to: players.find(p => p.player.id === t.toPlayer.id)?.id || '',
    amount: t.totalAmount
  }));

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player Name</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            const finalResult = calculateFinalResult(player);
            return (
              <TableRow key={player.id}>
                <TableCell>{player.player.name}</TableCell>
                <TableCell className={`text-right ${
                  finalResult >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${Math.abs(finalResult)} {getPaymentInstructions(finalResult)}
                </TableCell>
                <TableCell className="capitalize">{player.payment_status}</TableCell>
                <TableCell className="text-right">
                  {finalResult !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdatePaymentStatus(
                        player.id,
                        player.payment_status === 'pending' 
                          ? (finalResult > 0 ? 'received' : 'paid')
                          : 'pending'
                      )}
                    >
                      {player.payment_status === 'pending' 
                        ? (finalResult > 0 ? 'Mark as Received' : 'Mark as Paid')
                        : 'Mark as Pending'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TransactionsList 
        transactions={transactions}
        players={players}
        onUpdatePaymentStatus={onUpdatePaymentStatus}
      />
    </div>
  );
};

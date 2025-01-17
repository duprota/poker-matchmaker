import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GamePlayer {
  id: string;
  player: {
    name: string;
    email: string;
  };
  initial_buyin: number;
  total_rebuys: number;
  final_result: number | null;
  payment_status: string;
  payment_amount: number;
}

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

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Payment Management</h2>
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
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GamePlayer } from "@/types/game";

interface TotalAmountsTableProps {
  players: GamePlayer[];
}

export const TotalAmountsTable = ({ players }: TotalAmountsTableProps) => {
  const calculateTotalAmount = (player: GamePlayer) => {
    return player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Total Amounts In Game</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player Name</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>{player.player.name}</TableCell>
              <TableCell className="text-right">
                ${calculateTotalAmount(player)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">Total</TableCell>
            <TableCell className="text-right font-semibold">
              ${players.reduce((acc, player) => acc + calculateTotalAmount(player), 0)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
import { TableCell, TableRow } from "@/components/ui/table";
import { GamePlayer } from "@/types/game";

interface TotalRowProps {
  players: GamePlayer[];
}

export const TotalRow = ({ players }: TotalRowProps) => {
  const calculateTotalAmount = (player: GamePlayer) => {
    return player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  };

  return (
    <TableRow>
      <TableCell className="font-semibold">Total</TableCell>
      <TableCell className="text-right font-semibold">
        {players.reduce((acc, player) => acc + player.total_rebuys, 0)}
      </TableCell>
      <TableCell className="text-right font-semibold">
        ${players.reduce((acc, player) => acc + calculateTotalAmount(player), 0)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
};
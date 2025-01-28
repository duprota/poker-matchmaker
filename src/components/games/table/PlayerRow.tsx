import { TableCell, TableRow } from "@/components/ui/table";
import { GamePlayer } from "@/types/game";
import { EditableRebuys } from "./EditableRebuys";

interface PlayerRowProps {
  player: GamePlayer;
  onUpdateRebuys: (playerId: string, value: number) => Promise<void>;
}

export const PlayerRow = ({ player, onUpdateRebuys }: PlayerRowProps) => {
  const calculateTotalAmount = (player: GamePlayer) => {
    return player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  };

  return (
    <TableRow>
      <TableCell>{player.player.name}</TableCell>
      <TableCell className="text-right">
        <EditableRebuys
          playerId={player.id}
          initialValue={player.total_rebuys}
          onSave={(value) => onUpdateRebuys(player.id, value)}
        />
      </TableCell>
      <TableCell className="text-right">
        ${calculateTotalAmount(player)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
};
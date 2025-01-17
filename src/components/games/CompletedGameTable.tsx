import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
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
}

interface CompletedGameTableProps {
  players: GamePlayer[];
  calculateFinalResult: (player: GamePlayer) => number;
  totals: {
    buyIns: number;
    rebuys: number;
    finalSum: number;
    finalResult: number;
  };
}

export const CompletedGameTable = ({ 
  players, 
  calculateFinalResult,
  totals 
}: CompletedGameTableProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Final Results</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player Name</TableHead>
            <TableHead className="text-right">Buy In</TableHead>
            <TableHead className="text-right">Rebuys</TableHead>
            <TableHead className="text-right">Final Sum</TableHead>
            <TableHead className="text-right">Final Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((gamePlayer) => (
            <TableRow key={gamePlayer.id}>
              <TableCell>{gamePlayer.player.name}</TableCell>
              <TableCell className="text-right">${gamePlayer.initial_buyin}</TableCell>
              <TableCell className="text-right">${gamePlayer.total_rebuys * gamePlayer.initial_buyin}</TableCell>
              <TableCell className="text-right">${gamePlayer.final_result || 0}</TableCell>
              <TableCell className={`text-right ${calculateFinalResult(gamePlayer) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${calculateFinalResult(gamePlayer)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="border-t-2">
            <TableCell>Totals</TableCell>
            <TableCell className="text-right">${totals.buyIns}</TableCell>
            <TableCell className="text-right">${totals.rebuys}</TableCell>
            <TableCell className="text-right">${totals.finalSum}</TableCell>
            <TableCell className="text-right">${totals.finalResult}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
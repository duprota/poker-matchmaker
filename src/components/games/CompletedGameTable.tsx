
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  onUpdateResults: (playerId: string, newResult: number) => Promise<void>;
}

export const CompletedGameTable = ({ 
  players, 
  calculateFinalResult,
  totals,
  onUpdateResults
}: CompletedGameTableProps) => {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = (player: GamePlayer) => {
    setEditingPlayer(player.id);
    setEditValue(String(player.final_result || ""));
  };

  const handleSave = async (playerId: string) => {
    setIsUpdating(true);
    try {
      const numericValue = parseFloat(editValue);
      if (!isNaN(numericValue)) {
        await onUpdateResults(playerId, numericValue);
        setEditingPlayer(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to format the final result display
  const formatFinalResult = (value: number | null): string => {
    if (value === null || value === 0) {
      return "-";
    }
    return `$${value}`;
  };

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((gamePlayer) => (
            <TableRow key={gamePlayer.id}>
              <TableCell>{gamePlayer.player.name}</TableCell>
              <TableCell className="text-right">${gamePlayer.initial_buyin}</TableCell>
              <TableCell className="text-right">${gamePlayer.total_rebuys * gamePlayer.initial_buyin}</TableCell>
              <TableCell className="text-right">
                {editingPlayer === gamePlayer.id ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 inline-block border border-input bg-background px-3 py-2 text-base rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ appearance: 'textfield' }}
                    placeholder="Enter amount"
                  />
                ) : (
                  formatFinalResult(gamePlayer.final_result)
                )}
              </TableCell>
              <TableCell className={`text-right ${calculateFinalResult(gamePlayer) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${calculateFinalResult(gamePlayer)}
              </TableCell>
              <TableCell className="text-right">
                {editingPlayer === gamePlayer.id ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSave(gamePlayer.id)}
                    disabled={isUpdating}
                  >
                    Save
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(gamePlayer)}
                  >
                    Edit
                  </Button>
                )}
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
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

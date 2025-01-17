import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GameHistoryEntry {
  id: string;
  event_type: 'rebuy' | 'result_update';
  amount: number;
  created_at: string;
  player: {
    name: string;
  };
}

interface GameHistoryProps {
  gameId: string;
}

export const GameHistory = ({ gameId }: GameHistoryProps) => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('game_history')
          .select(`
            id,
            event_type,
            amount,
            created_at,
            player:players (
              name
            )
          `)
          .eq('game_id', gameId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching game history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [gameId]);

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Game History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {new Date(entry.created_at).toLocaleString()}
              </TableCell>
              <TableCell>{entry.player.name}</TableCell>
              <TableCell>
                {entry.event_type === 'rebuy' ? 'Rebuy' : 'Result Update'}
              </TableCell>
              <TableCell className="text-right">
                ${entry.amount || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
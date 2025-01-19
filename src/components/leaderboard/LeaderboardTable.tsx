import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  total_winnings: number;
  biggest_win: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

export const LeaderboardTable = ({ entries, isLoading }: LeaderboardTableProps) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading leaderboard data...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Position</TableHead>
          <TableHead>Player</TableHead>
          <TableHead>Games Played</TableHead>
          <TableHead>Total Winnings</TableHead>
          <TableHead>Biggest Win</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries?.map((entry, index) => (
          <TableRow key={entry.player_name}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{entry.player_name}</TableCell>
            <TableCell>{entry.games_played}</TableCell>
            <TableCell className={entry.total_winnings >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${entry.total_winnings}
            </TableCell>
            <TableCell>${entry.biggest_win}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaderboardEntry {
  position: number;
  player: string;
  gamesPlayed: number;
  totalWinnings: number;
  biggestWin: number;
}

const Leaderboard = () => {
  const leaderboard: LeaderboardEntry[] = [
    {
      position: 1,
      player: "John Doe",
      gamesPlayed: 10,
      totalWinnings: 1500,
      biggestWin: 500,
    },
    {
      position: 2,
      player: "Jane Smith",
      gamesPlayed: 8,
      totalWinnings: 1200,
      biggestWin: 400,
    },
    {
      position: 3,
      player: "Mike Johnson",
      gamesPlayed: 12,
      totalWinnings: 1000,
      biggestWin: 300,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-6">2024 Leaderboard</h1>
        
        <Card className="p-4">
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
              {leaderboard.map((entry) => (
                <TableRow key={entry.position}>
                  <TableCell className="font-medium">{entry.position}</TableCell>
                  <TableCell>{entry.player}</TableCell>
                  <TableCell>{entry.gamesPlayed}</TableCell>
                  <TableCell>${entry.totalWinnings}</TableCell>
                  <TableCell>${entry.biggestWin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
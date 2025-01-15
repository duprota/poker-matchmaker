import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Player {
  id: number;
  name: string;
  totalGames: number;
  totalWinnings: number;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: players.length + 1,
        name: newPlayerName.trim(),
        totalGames: 0,
        totalWinnings: 0,
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Players</h1>
        
        <div className="flex gap-4 mb-8">
          <Input
            placeholder="Player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={addPlayer}>Add Player</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <Card key={player.id} className="p-4">
              <h3 className="text-xl font-semibold mb-2">{player.name}</h3>
              <p className="text-gray-600">Games played: {player.totalGames}</p>
              <p className="text-gray-600">
                Total winnings: ${player.totalWinnings.toFixed(2)}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Players;
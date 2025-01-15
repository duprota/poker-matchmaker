import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Game {
  id: number;
  date: string;
  players: string[];
  buyIn: number;
  status: "ongoing" | "completed";
}

const Games = () => {
  const games: Game[] = [
    {
      id: 1,
      date: "2024-01-20",
      players: ["John", "Mike", "Sarah"],
      buyIn: 100,
      status: "completed",
    },
    {
      id: 2,
      date: "2024-01-27",
      players: ["John", "Mike", "Sarah", "Tom"],
      buyIn: 100,
      status: "ongoing",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Games</h1>
          <Button asChild>
            <Link to="/games/new">New Game</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card key={game.id} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Game #{game.id}</h3>
                  <p className="text-gray-600">{game.date}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  game.status === "ongoing" 
                    ? "bg-yellow-200 text-yellow-800" 
                    : "bg-green-200 text-green-800"
                }`}>
                  {game.status}
                </span>
              </div>
              <p className="text-gray-600 mb-2">Buy-in: ${game.buyIn}</p>
              <p className="text-gray-600 mb-4">Players: {game.players.join(", ")}</p>
              <Button asChild variant="secondary" className="w-full">
                <Link to={`/games/${game.id}`}>View Details</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
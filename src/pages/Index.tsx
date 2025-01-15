import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Welcome to Poker Manager</h1>
          <p className="text-lg text-gray-300 mb-8">Track your poker games, manage players, and see who's leading the pack!</p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/games/new" className="bg-primary hover:bg-primary/90">New Game</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
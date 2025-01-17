import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Navigation = () => {
  const { session, handleSignOut } = useAuth();

  if (!session) return null;

  return (
    <nav className="bg-primary p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          Poker Manager
        </Link>
        <div className="space-x-4">
          <Link to="/games" className="text-white hover:text-secondary">
            Games
          </Link>
          <Link to="/players" className="text-white hover:text-secondary">
            Players
          </Link>
          <Link to="/leaderboard" className="text-white hover:text-secondary">
            Leaderboard
          </Link>
          <Link to="/financials" className="text-white hover:text-secondary">
            Financials
          </Link>
          <Button
            variant="secondary"
            className="ml-4"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};
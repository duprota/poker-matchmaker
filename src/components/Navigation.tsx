import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Navigation = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState<'user' | 'manager' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return;
    }

    setUserRole(data?.role || 'user');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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
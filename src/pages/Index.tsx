import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, TrendingUp, GamepadIcon, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AuthError } from '@supabase/supabase-js';

const Index = () => {
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState<'user' | 'manager' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setAuthError(error.message);
        return;
      }
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN') {
        setAuthError(null);
      }
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
      toast({
        title: "Error",
        description: "Failed to fetch user role",
        variant: "destructive",
      });
      return;
    }

    setUserRole(data?.role || 'user');
  };

  const handlePromoteToManager = async () => {
    try {
      const { error } = await supabase.rpc('promote_to_manager', {
        user_id: session?.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have been promoted to manager status!",
      });
      
      setUserRole('manager');
    } catch (error) {
      console.error('Error promoting to manager:', error);
      toast({
        title: "Error",
        description: "Failed to promote to manager status",
        variant: "destructive",
      });
    }
  };

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log("Fetching dashboard stats...");
      const [gamesCount, playersCount, lastGame, topProfit] = await Promise.all([
        supabase.from('games').select('id', { count: 'exact' }),
        supabase.from('players').select('id', { count: 'exact' }),
        supabase.from('games').select('date').order('date', { ascending: false }).limit(1),
        supabase.from('game_players').select('final_result').order('final_result', { ascending: false }).limit(1)
      ]);
      
      console.log("Stats results:", { gamesCount, playersCount, lastGame, topProfit });
      
      return {
        gamesCount: gamesCount.count || 0,
        playersCount: playersCount.count || 0,
        lastGameDate: lastGame.data?.[0]?.date,
        topProfit: topProfit.data?.[0]?.final_result || 0
      };
    },
    enabled: !!session
  });

  // Fetch recent games
  const { data: recentGames } = useQuery({
    queryKey: ['recent-games'],
    queryFn: async () => {
      console.log("Fetching recent games...");
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          name,
          date,
          game_players (
            player:players (
              name
            ),
            final_result
          )
        `)
        .order('date', { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching recent games:", error);
        throw error;
      }

      console.log("Recent games data:", data);
      return data;
    },
    enabled: !!session
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Welcome to Poker Manager</h1>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary-foreground))'
                  }
                }
              }
            }}
            theme="light"
            providers={[]}
            onError={(error: AuthError) => {
              console.error('Auth error:', error);
              setAuthError(error.message);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-12 px-4">
        {/* Role Status and Promotion */}
        {userRole === 'user' && (
          <Alert className="mb-8">
            <AlertDescription>
              You are currently a regular user. To create and manage games, you need to become a manager.
              <Button onClick={handlePromoteToManager} variant="outline" className="ml-4">
                Become a Manager
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6">Welcome to Poker Manager</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Track your poker games, manage players, and see who's leading the pack!
          </p>
          <div className="flex justify-center gap-4">
            {userRole === 'manager' && (
              <Button asChild size="lg" className="gap-2">
                <Link to="/games/new">
                  <GamepadIcon className="w-5 h-5" />
                  New Game
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg" className="gap-2">
              <Link to="/leaderboard">
                <Trophy className="w-5 h-5" />
                View Leaderboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <GamepadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.gamesCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.playersCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Game</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.lastGameDate ? format(new Date(stats.lastGameDate), 'MMM d') : '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.topProfit || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentGames?.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {game.name || format(new Date(game.date), 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(game.date), 'PPp')}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Players: {game.game_players.map(gp => gp.player.name).join(', ')}
                  </div>
                  <Link 
                    to={`/games/${game.id}`}
                    className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    View Details →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/players">View Players</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/financials">View Financials</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
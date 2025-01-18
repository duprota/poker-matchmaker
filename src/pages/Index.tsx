import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, TrendingUp, GamepadIcon, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError, AuthApiError } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { session, userRole, handlePromoteToManager } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Current session:", session);
    console.log("Current user role:", userRole);
  }, [session, userRole]);

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          return 'Invalid email or password. Please check your credentials and try again.';
        case 422:
          return 'Invalid email format. Please check your email address.';
        default:
          return 'Authentication error. Please try again.';
      }
    }
    return error.message;
  };

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log("Fetching dashboard stats...");
      try {
        const [gamesCount, playersCount, lastGame, topProfit] = await Promise.all([
          supabase.from('games').select('id', { count: 'exact' }),
          supabase.from('players').select('id', { count: 'exact' }),
          supabase.from('games').select('date').order('date', { ascending: false }).limit(1),
          supabase.from('game_players').select('final_result').order('final_result', { ascending: false }).limit(1)
        ]);
        
        console.log("Stats results:", { gamesCount, playersCount, lastGame, topProfit });
        
        if (gamesCount.error) throw gamesCount.error;
        if (playersCount.error) throw playersCount.error;
        if (lastGame.error) throw lastGame.error;
        if (topProfit.error) throw topProfit.error;

        return {
          gamesCount: gamesCount.count || 0,
          playersCount: playersCount.count || 0,
          lastGameDate: lastGame.data?.[0]?.date,
          topProfit: topProfit.data?.[0]?.final_result || 0
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!session
  });

  const { data: recentGames } = useQuery({
    queryKey: ['recent-games'],
    queryFn: async () => {
      console.log("Fetching recent games...");
      try {
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
      } catch (error) {
        console.error("Error in recent games query:", error);
        toast({
          title: "Error",
          description: "Failed to fetch recent games",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!session
  });

  return (
    <div className="min-h-screen bg-background">
      {!session ? (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome to Poker Manager</h1>
              <p className="text-muted-foreground">Sign in to start managing your poker games</p>
            </div>

            <Card>
              <CardContent className="pt-6">
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
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Index;

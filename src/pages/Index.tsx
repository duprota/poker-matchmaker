import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, TrendingUp, GamepadIcon, Award, Rocket, Star, Heart, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  // Add a test effect to check Supabase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Supabase connection...");
        const { data, error } = await supabase
          .from('games')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error("Supabase connection error:", error);
          toast({
            title: "Connection Error",
            description: `Failed to connect to Supabase: ${error.message}`,
            variant: "destructive",
          });
          throw error;
        }
        
        console.log("Supabase connection successful:", data);
        toast({
          title: "Connection Success",
          description: "Successfully connected to Supabase",
        });
      } catch (err) {
        console.error("Error testing connection:", err);
      }
    };

    testConnection();
  }, []);

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
    }
  });

  // Fetch recent games with nested player data
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

      // Process the data to sort players by final result
      const processedGames = data?.map(game => ({
        ...game,
        game_players: game.game_players
          .filter(player => player.final_result !== null)
          .sort((a, b) => (b.final_result || 0) - (a.final_result || 0))
          .slice(0, 3) // Get top 3 players
      }));

      console.log("Recent games data:", processedGames);
      return processedGames;
    }
  });

  // Helper function to render player position
  const renderPlayerPosition = (index: number, playerName: string, result: number) => {
    const positionStyles = {
      0: "text-yellow-500 font-bold flex items-center gap-1",
      1: "text-gray-400 font-semibold",
      2: "text-amber-600 font-semibold"
    };

    return (
      <div className={positionStyles[index as keyof typeof positionStyles]}>
        {index === 0 && <Trophy className="h-4 w-4 animate-bounce" />}
        {playerName} (${result})
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome to Poker Manager
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6">
            Track your games, manage players, and climb the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="gap-2 animate-pulse">
              <Link to="/games/new">
                <GamepadIcon className="w-5 h-5" />
                New Game
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="gap-2 hover:scale-105 transition-transform">
              <Link to="/leaderboard">
                <Trophy className="w-5 h-5" />
                View Leaderboard
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:scale-105 transition-transform">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                <GamepadIcon className="h-4 w-4 text-primary animate-bounce" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.gamesCount || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:scale-105 transition-transform">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Players</CardTitle>
                <Users className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.playersCount || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:scale-105 transition-transform">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Game</CardTitle>
                <Calendar className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.lastGameDate ? format(new Date(stats.lastGameDate), 'MMM d') : '-'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:scale-105 transition-transform">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.topProfit || 0}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Games Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Recent Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentGames?.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="hover:scale-105 transition-transform bg-gradient-to-br from-card to-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {game.name || format(new Date(game.date), 'MMMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(game.date), 'PPp')}
                    </div>
                    <div className="mt-4 space-y-2">
                      {game.game_players.map((gp, idx) => (
                        <div key={idx}>
                          {renderPlayerPosition(idx, gp.player.name, gp.final_result || 0)}
                        </div>
                      ))}
                    </div>
                    <Link 
                      to={`/games/${game.id}`}
                      className="mt-4 inline-flex items-center text-sm text-primary hover:underline gap-1"
                    >
                      View Details <Rocket className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Access Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Player Management
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/players">View Players</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/financials">View Financials</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;

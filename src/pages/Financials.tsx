import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { AggregatedPaymentsTable } from "@/components/financials/AggregatedPaymentsTable";
import { supabase } from "@/integrations/supabase/client";
import type { Game } from "@/types/game";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const Financials = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaidExpanded, setIsPaidExpanded] = useState(true);

  const fetchGames = async () => {
    try {
      console.log('Fetching games data for financials...');
      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select(`
          *,
          players:game_players (
            id,
            game_id,
            initial_buyin,
            total_rebuys,
            final_result,
            payment_status,
            payment_amount,
            player:players (
              id,
              name,
              email
            )
          )
        `)
        .eq("status", "completed");

      if (gamesError) throw gamesError;

      const typedGames = (gamesData || []).map(game => ({
        ...game,
        status: game.status as GameStatus,
      }));

      console.log('Fetched games data:', typedGames);
      setGames(typedGames);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('game_players_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players'
        },
        (payload) => {
          console.log('Received game_players change:', payload);
          fetchGames();
        }
      )
      .subscribe();

    fetchGames();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4 space-y-6">
        <h1 className="text-2xl font-bold mb-6">
          Consolidated Payments
        </h1>

        {loading ? (
          <p className="text-muted-foreground text-center">Loading payment data...</p>
        ) : games.length === 0 ? (
          <p className="text-muted-foreground text-center">No completed games found.</p>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Transactions</h2>
              <AggregatedPaymentsTable 
                games={games} 
                filterStatus="pending"
              />
            </Card>

            <Card className="p-6">
              <Collapsible open={isPaidExpanded} onOpenChange={setIsPaidExpanded}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Paid Transactions</h2>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isPaidExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <AggregatedPaymentsTable 
                    games={games} 
                    filterStatus="paid"
                  />
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Financials;
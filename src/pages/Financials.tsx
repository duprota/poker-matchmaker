import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { AggregatedPaymentsTable } from "@/components/financials/AggregatedPaymentsTable";
import { supabase } from "@/integrations/supabase/client";
import type { Game } from "@/types/game";

const Financials = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
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

        setGames(gamesData || []);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">
          Consolidated Payments
        </h1>
        <Card className="p-6">
          {loading ? (
            <p className="text-muted-foreground text-center">Loading payment data...</p>
          ) : games.length === 0 ? (
            <p className="text-muted-foreground text-center">No completed games found.</p>
          ) : (
            <AggregatedPaymentsTable games={games} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Financials;
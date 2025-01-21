import { Navigation } from "@/components/Navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchHistoricalTransactions, updatePaymentStatus } from "@/utils/transactionUtils";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Financials = () => {
  const queryClient = useQueryClient();
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['historical-transactions'],
    queryFn: fetchHistoricalTransactions,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription for game_players table...');
    const channel = supabase
      .channel('game-players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players'
        },
        (payload) => {
          console.log('Received real-time update for game_players:', payload);
          toast({
            title: "Payment status updated",
            description: "The transaction list has been refreshed.",
          });
          queryClient.invalidateQueries({ queryKey: ['historical-transactions'] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleMarkAsPaid = async (gamePlayerIds: string[]) => {
    await updatePaymentStatus(gamePlayerIds, 'paid');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">
            Transactions
          </h1>
          <div className="text-center py-8 text-muted-foreground">
            Loading transaction history...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">
            Transactions
          </h1>
          <div className="text-center py-8 text-destructive">
            Error loading transaction history. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const pendingTransactions = transactions?.filter(t => t.paymentStatus === 'pending') || [];
  const paidTransactions = transactions?.filter(t => t.paymentStatus === 'paid') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">
          Transactions
        </h1>
        
        <TransactionList
          title="Pending Transactions"
          transactions={pendingTransactions}
          onMarkAsPaid={handleMarkAsPaid}
          emptyMessage="No pending transactions to display."
        />

        <TransactionList
          title="Payment History"
          transactions={paidTransactions}
          onMarkAsPaid={handleMarkAsPaid}
          emptyMessage="No payment history to display."
        />
      </div>
    </div>
  );
};

export default Financials;
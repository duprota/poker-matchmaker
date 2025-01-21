import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, Clock, QrCode } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameDebtDetail {
  gameId: string;
  date: string;
  amount: number;
  gamePlayerId: string;
}

interface TransactionSummary {
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
  gamePlayerIds: string[];
  paymentStatus: string;
  gameDetails: GameDebtDetail[];
  toPixKey?: string;
}

const fetchHistoricalTransactions = async (): Promise<TransactionSummary[]> => {
  console.log('Fetching historical transactions...');
  const { data: gamePlayers, error } = await supabase
    .from('game_players')
    .select(`
      id,
      payment_status,
      payment_amount,
      game_id,
      player_id,
      final_result,
      games (
        date,
        manager_id,
        players!games_manager_id_fkey (
          name,
          pix_key
        )
      ),
      players!game_players_player_id_fkey (
        name,
        pix_key,
        id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  // Transform the data into TransactionSummary format
  const transactions: TransactionSummary[] = gamePlayers.map((gp: any) => {
    const finalResult = gp.final_result || 0;
    // If finalResult is positive, player receives money. If negative, they need to pay
    const isReceiving = finalResult > 0;
    
    // Get the manager's name and PIX key
    const managerName = gp.games.players?.name || 'Game Manager';
    const managerPixKey = gp.games.players?.pix_key;
    
    return {
      from: isReceiving ? managerName : gp.players.name,
      fromId: isReceiving ? gp.games.manager_id : gp.player_id,
      to: isReceiving ? gp.players.name : managerName,
      toId: isReceiving ? gp.player_id : gp.games.manager_id,
      amount: Math.abs(finalResult),
      gamePlayerIds: [gp.id],
      paymentStatus: gp.payment_status || 'pending',
      toPixKey: isReceiving ? gp.players.pix_key : managerPixKey,
      gameDetails: [{
        gameId: gp.game_id,
        date: gp.games.date,
        amount: Math.abs(finalResult),
        gamePlayerId: gp.id
      }]
    };
  });

  console.log('Processed transactions:', transactions);
  return transactions;
};

const Financials = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
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
          // Show a toast notification
          toast({
            title: "Payment status updated",
            description: "The transaction list has been refreshed.",
          });
          // Invalidate and refetch the transactions query
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
    try {
      console.log('Marking transactions as paid:', gamePlayerIds);
      const { error } = await supabase
        .from('game_players')
        .update({ 
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .in('id', gamePlayerIds);

      if (error) throw error;

      console.log('Successfully marked transactions as paid');
      toast({
        title: "Success",
        description: "The payment has been marked as paid successfully.",
      });
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment as paid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderTransactionCard = (transaction: TransactionSummary) => {
    const isPaid = transaction.paymentStatus === 'paid';
    return (
      <Card className={`p-4 mb-4 animate-fade-in hover:scale-[1.01] transition-all backdrop-blur-sm ${isPaid ? 'bg-muted/50' : 'bg-card/80 border-primary/20'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${isPaid ? 'bg-green-500/20' : 'bg-primary/20'}`}>
              {isPaid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground bg-gradient-to-r from-primary/80 via-secondary/80 to-accent/80 bg-clip-text">{transaction.from} → {transaction.to}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.gameDetails[0].date), 'MMM d, yyyy')}
              </p>
              {transaction.toPixKey && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex items-center gap-1 text-sm text-muted-foreground mt-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(transaction.toPixKey || '');
                          toast({
                            title: "PIX key copied",
                            description: "The PIX key has been copied to your clipboard.",
                          });
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">{transaction.toPixKey}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy PIX key</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-foreground bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              ${transaction.amount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {transaction.paymentStatus}
            </p>
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline hover:text-primary transition-colors">
              Game Details
            </AccordionTrigger>
            <AccordionContent className="text-sm space-y-2">
              {transaction.gameDetails.map((detail, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-muted/50 backdrop-blur-sm">
                  <span className="text-foreground">{format(new Date(detail.date), 'MMM d, yyyy')}</span>
                  <span className="font-medium text-foreground">${detail.amount.toFixed(2)}</span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {!isPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAsPaid(transaction.gamePlayerIds)}
            className="w-full mt-2 bg-card/80 hover:bg-primary/20 hover:text-primary transition-colors border-primary/20"
          >
            Mark as Paid
          </Button>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            Historical Transactions
          </h1>
          <Card className="p-4 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-8 text-muted-foreground">Loading transaction history...</div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            Historical Transactions
          </h1>
          <Card className="p-4 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-8 text-destructive">
              Error loading transaction history. Please try again later.
            </div>
          </Card>
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
          Historical Transactions
        </h1>
        
        {/* Pending Transactions */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-primary/80 via-secondary/80 to-accent/80 bg-clip-text">
            Pending Transactions
          </h2>
          {pendingTransactions.length > 0 ? (
            <div className="space-y-4">
              {pendingTransactions.map((transaction, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {renderTransactionCard(transaction)}
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
              <div className="text-center text-muted-foreground">
                No pending transactions to display.
              </div>
            </Card>
          )}
        </div>

        {/* Payment History */}
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-xl font-semibold mb-4 text-foreground bg-gradient-to-r from-primary/80 via-secondary/80 to-accent/80 bg-clip-text">
            Payment History
          </h2>
          {paidTransactions.length > 0 ? (
            <div className="space-y-4">
              {paidTransactions.map((transaction, index) => (
                <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {renderTransactionCard(transaction)}
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20">
              <div className="text-center text-muted-foreground">
                No payment history to display.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Financials;

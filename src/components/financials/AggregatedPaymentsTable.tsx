import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/types/game";
import { calculateOptimizedPayments } from "@/utils/paymentOptimization";
import { PaymentRowHeader } from "./PaymentRowHeader";
import { PaymentDetail } from "./PaymentDetail";

interface Props {
  games: Game[];
  filterStatus: 'paid' | 'pending';
}

export const AggregatedPaymentsTable = ({ games, filterStatus }: Props) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const handleUpdatePaymentStatus = async (gamePlayerId: string, newStatus: string) => {
    try {
      console.log(`Updating payment status for game player ${gamePlayerId} to ${newStatus}`);
      
      const { error } = await supabase
        .from("game_players")
        .update({ payment_status: newStatus })
        .eq("id", gamePlayerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const aggregatedPayments = calculateOptimizedPayments(games);
  console.log('Aggregated payments:', aggregatedPayments);

  const filteredPayments = aggregatedPayments.filter(payment => {
    const hasMatchingDetails = payment.details.some(detail => 
      filterStatus === 'paid' ? detail.paymentStatus === 'paid' : detail.paymentStatus === 'pending'
    );
    return hasMatchingDetails;
  });

  if (filteredPayments.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No {filterStatus} transactions found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filteredPayments.map((payment) => {
        const key = `${payment.fromPlayer.id}-${payment.toPlayer.id}`;
        const isExpanded = expandedRows.has(key);
        
        const filteredDetails = payment.details.filter(detail => 
          filterStatus === 'paid' ? detail.paymentStatus === 'paid' : detail.paymentStatus === 'pending'
        );

        const totalAmount = filteredDetails.reduce((sum, detail) => sum + detail.amount, 0);
        
        return (
          <div key={key} className="space-y-2 animate-fade-in">
            <Card 
              className={`p-4 transition-all duration-300 hover:bg-muted/50 ${
                filterStatus === 'paid' 
                  ? 'bg-green-500/10 hover:bg-green-500/20' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <PaymentRowHeader
                fromPlayerName={payment.fromPlayer.name}
                toPlayerName={payment.toPlayer.name}
                totalAmount={totalAmount}
                isExpanded={isExpanded}
                detailsCount={filteredDetails.length}
                onToggle={() => toggleRowExpansion(key)}
              />
            </Card>

            {isExpanded && (
              <div className="pl-4 space-y-2">
                {filteredDetails.map((detail, index) => (
                  <PaymentDetail
                    key={`${key}-detail-${index}`}
                    gameName={detail.gameName}
                    gameDate={detail.gameDate}
                    amount={detail.amount}
                    paymentStatus={detail.paymentStatus}
                    gamePlayerId={detail.gamePlayerId}
                    onStatusUpdate={handleUpdatePaymentStatus}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
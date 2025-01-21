import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowRight, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/types/game";
import { calculateOptimizedPayments } from "@/utils/paymentOptimization";

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

  // Filter payments based on status
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
        
        // Filter details based on status
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.fromPlayer.name}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{payment.toPlayer.name}</span>
                  <span className="font-semibold text-lg ml-2">${totalAmount.toFixed(2)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRowExpansion(key)}
                  className="w-full sm:w-auto"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  {filteredDetails.length} transaction{filteredDetails.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </Card>

            {isExpanded && (
              <div className="pl-4 space-y-2">
                {filteredDetails.map((detail, index) => (
                  <Card 
                    key={`${key}-detail-${index}`} 
                    className="p-4 bg-muted/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {detail.gameName || 'Unnamed Game'} ({formatDate(detail.gameDate)})
                        </p>
                        <p className="font-medium">${detail.amount.toFixed(2)}</p>
                      </div>
                      <Button
                        variant={detail.paymentStatus === 'paid' ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleUpdatePaymentStatus(
                          detail.gamePlayerId,
                          detail.paymentStatus === 'pending' ? 'paid' : 'pending'
                        )}
                        className={`w-full sm:w-auto transition-all duration-200 ${
                          detail.paymentStatus === 'paid' 
                            ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' 
                            : 'hover:bg-green-500/90'
                        }`}
                      >
                        {detail.paymentStatus === 'paid' ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            <span>Mark as Pending</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            <span>Mark as Paid</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
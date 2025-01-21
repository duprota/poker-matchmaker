import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Game } from "@/types/game";
import { calculateOptimizedPayments } from "@/utils/paymentOptimization";

interface Props {
  games: Game[];
}

export const AggregatedPaymentsTable = ({ games }: Props) => {
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

  const isDetailPaid = (detail: any) => {
    return detail.paymentStatus === 'paid';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregatedPayments.map((payment) => {
          const key = `${payment.fromPlayer.id}-${payment.toPlayer.id}`;
          const isExpanded = expandedRows.has(key);
          
          return (
            <React.Fragment key={key}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRowExpansion(key)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell>{payment.fromPlayer.name}</TableCell>
                <TableCell>{payment.toPlayer.name}</TableCell>
                <TableCell className="text-right">${payment.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {payment.details.length === 0 ? (
                    <span className="text-muted-foreground">No details</span>
                  ) : (
                    <span className="text-muted-foreground">
                      {payment.details.filter(isDetailPaid).length} of {payment.details.length} paid
                    </span>
                  )}
                </TableCell>
              </TableRow>
              {isExpanded && payment.details.map((detail, index) => (
                <TableRow key={`${key}-detail-${index}`} className="bg-muted/50">
                  <TableCell></TableCell>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    {detail.gameName || 'Unnamed Game'} ({formatDate(detail.gameDate)})
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    ${detail.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdatePaymentStatus(
                        detail.gamePlayerId,
                        detail.paymentStatus === 'pending' ? 'paid' : 'pending'
                      )}
                    >
                      {detail.paymentStatus === 'pending' ? 'Mark as Paid' : 'Mark as Pending'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
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
import type { Game, GamePlayer } from "@/types/game";

interface PaymentDetail {
  gameId: string;
  gameName: string | null;
  gameDate: string;
  amount: number;
  gamePlayerId: string;
  paymentStatus: string;
}

interface AggregatedPayment {
  fromPlayer: {
    id: string;
    name: string;
  };
  toPlayer: {
    id: string;
    name: string;
  };
  totalAmount: number;
  details: PaymentDetail[];
}

interface Props {
  games: Game[];
}

export const AggregatedPaymentsTable = ({ games }: Props) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const aggregatePayments = (games: Game[]): AggregatedPayment[] => {
    const paymentMap = new Map<string, AggregatedPayment>();

    games.forEach(game => {
      const players = game.players;
      
      players.forEach(player => {
        const finalResult = calculateFinalResult(player);
        if (finalResult < 0) {
          // Player owes money
          players.forEach(otherPlayer => {
            if (player.id !== otherPlayer.id) {
              const otherPlayerResult = calculateFinalResult(otherPlayer);
              if (otherPlayerResult > 0) {
                // Calculate proportional payment
                const payment = calculatePaymentBetweenPlayers(player, otherPlayer, game);
                if (payment > 0) {
                  const key = `${player.player.id}-${otherPlayer.player.id}`;
                  if (!paymentMap.has(key)) {
                    paymentMap.set(key, {
                      fromPlayer: {
                        id: player.player.id,
                        name: player.player.name,
                      },
                      toPlayer: {
                        id: otherPlayer.player.id,
                        name: otherPlayer.player.name,
                      },
                      totalAmount: 0,
                      details: [],
                    });
                  }
                  
                  const aggregated = paymentMap.get(key)!;
                  aggregated.totalAmount += payment;
                  aggregated.details.push({
                    gameId: game.id,
                    gameName: game.name,
                    gameDate: game.date,
                    amount: payment,
                    gamePlayerId: player.id,
                    paymentStatus: player.payment_status
                  });
                }
              }
            }
          });
        }
      });
    });

    return Array.from(paymentMap.values());
  };

  const calculateFinalResult = (player: GamePlayer) => {
    const finalSum = player.final_result || 0;
    const buyIn = player.initial_buyin || 0;
    const rebuys = player.total_rebuys || 0;
    return finalSum - buyIn - (rebuys * buyIn);
  };

  const calculatePaymentBetweenPlayers = (
    fromPlayer: GamePlayer,
    toPlayer: GamePlayer,
    game: Game
  ) => {
    const fromPlayerLoss = Math.abs(calculateFinalResult(fromPlayer));
    const toPlayerWin = calculateFinalResult(toPlayer);
    const totalWinnings = game.players
      .map(p => calculateFinalResult(p))
      .filter(result => result > 0)
      .reduce((sum, result) => sum + result, 0);

    return (fromPlayerLoss * (toPlayerWin / totalWinnings));
  };

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const handleUpdatePaymentStatus = async (payment: AggregatedPayment, newStatus: string) => {
    try {
      console.log(`Updating payment status for multiple games to ${newStatus}`);
      
      // Update all game_players records for this player pair
      for (const detail of payment.details) {
        const { error } = await supabase
          .from("game_players")
          .update({ payment_status: newStatus })
          .eq("id", detail.gamePlayerId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

      // Refresh the games data
      window.location.reload();
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const aggregatedPayments = aggregatePayments(games);

  const isAllPaid = (payment: AggregatedPayment) => {
    return payment.details.every(detail => detail.paymentStatus === 'paid');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Total Amount</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregatedPayments.map((payment) => {
          const key = `${payment.fromPlayer.id}-${payment.toPlayer.id}`;
          const isExpanded = expandedRows.has(key);
          const allPaid = isAllPaid(payment);
          
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePaymentStatus(
                      payment,
                      allPaid ? 'pending' : 'paid'
                    )}
                  >
                    {allPaid ? 'Mark as Pending' : 'Mark as Paid'}
                  </Button>
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
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
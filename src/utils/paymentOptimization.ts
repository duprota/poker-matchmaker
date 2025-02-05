import type { Game, GamePlayer } from "@/types/game";
import { calculateFinalResult } from "@/components/games/GameCalculations";

interface PlayerBalance {
  playerId: string;
  playerName: string;
  balance: number;
}

interface Transaction {
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

interface PaymentDetail {
  gameId: string;
  gameName: string | null;
  gameDate: string;
  amount: number;
  gamePlayerId: string;
  paymentStatus: string;
}

export const calculateOptimizedPayments = (games: Game[]): Transaction[] => {
  console.log('Starting payment optimization for games:', games);
  
  // Step 1: Process each game individually to maintain game-level payment relationships
  const gameTransactions = new Map<string, Transaction>();
  
  games.forEach(game => {
    // Calculate balances for this specific game
    const gameBalances = new Map<string, number>();
    const playerDetails = new Map<string, { name: string, gamePlayerId: string, paymentStatus: string }>();
    
    game.players.forEach(player => {
      const result = calculateFinalResult(player);
      gameBalances.set(player.player.id, result);
      playerDetails.set(player.player.id, {
        name: player.player.name,
        gamePlayerId: player.id,
        paymentStatus: player.payment_status
      });
    });

    // For each game, create transactions between players
    const debtors = Array.from(gameBalances.entries())
      .filter(([_, balance]) => balance < 0)
      .map(([id, balance]) => ({
        id,
        amount: Math.abs(balance),
        name: playerDetails.get(id)!.name
      }));

    const creditors = Array.from(gameBalances.entries())
      .filter(([_, balance]) => balance > 0)
      .map(([id, balance]) => ({
        id,
        amount: balance,
        name: playerDetails.get(id)!.name
      }));

    // Match debtors with creditors within the same game
    debtors.forEach(debtor => {
      let remainingDebt = debtor.amount;
      
      creditors.forEach(creditor => {
        if (remainingDebt <= 0 || creditor.amount <= 0) return;

        const amount = Math.min(remainingDebt, creditor.amount);
        if (amount <= 0) return;

        const transactionKey = `${debtor.id}-${creditor.id}`;
        const detail: PaymentDetail = {
          gameId: game.id,
          gameName: game.name || null,
          gameDate: game.date,
          amount: Number(amount.toFixed(2)),
          gamePlayerId: playerDetails.get(debtor.id)!.gamePlayerId,
          paymentStatus: playerDetails.get(debtor.id)!.paymentStatus
        };

        if (!gameTransactions.has(transactionKey)) {
          gameTransactions.set(transactionKey, {
            fromPlayer: { id: debtor.id, name: debtor.name },
            toPlayer: { id: creditor.id, name: creditor.name },
            totalAmount: 0,
            details: []
          });
        }

        const transaction = gameTransactions.get(transactionKey)!;
        transaction.details.push(detail);
        transaction.totalAmount = Number((transaction.totalAmount + amount).toFixed(2));

        remainingDebt -= amount;
        creditor.amount -= amount;
      });
    });
  });

  // Convert map to array and sort by total amount
  const transactions = Array.from(gameTransactions.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  console.log('Generated transactions:', transactions);
  return transactions;
};
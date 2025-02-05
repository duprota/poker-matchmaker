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
  
  // Step 1: Create a map to store transactions between player pairs
  const transactionMap = new Map<string, Transaction>();

  // Process each game
  games.forEach(game => {
    // Calculate net positions for this game using the same logic as in GameCalculations
    const gameResults = new Map<string, number>();
    
    // Calculate final results for each player using the same logic as in game details
    game.players.forEach(player => {
      const result = calculateFinalResult(player);
      if (result !== 0) {
        gameResults.set(player.player.id, result);
      }
    });

    // Create transactions for this game
    const losers = Array.from(gameResults.entries())
      .filter(([_, amount]) => amount < 0)
      .sort((a, b) => a[1] - b[1]); // Sort by loss amount (ascending)

    const winners = Array.from(gameResults.entries())
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by win amount (descending)

    losers.forEach(([loserId, lossAmount]) => {
      const loser = game.players.find(p => p.player.id === loserId)!;
      let remainingLoss = Math.abs(lossAmount);

      winners.forEach(([winnerId, winAmount]) => {
        if (remainingLoss <= 0) return;

        const winner = game.players.find(p => p.player.id === winnerId)!;
        const transactionAmount = Math.min(remainingLoss, winAmount);
        
        if (transactionAmount > 0) {
          const key = `${loserId}-${winnerId}`;
          
          // Create or update transaction detail
          const detail: PaymentDetail = {
            gameId: game.id,
            gameName: game.name || null,
            gameDate: game.date,
            amount: Number(transactionAmount.toFixed(2)),
            gamePlayerId: loser.id,
            paymentStatus: loser.payment_status
          };

          if (!transactionMap.has(key)) {
            transactionMap.set(key, {
              fromPlayer: { id: loserId, name: loser.player.name },
              toPlayer: { id: winnerId, name: winner.player.name },
              totalAmount: 0,
              details: []
            });
          }

          const transaction = transactionMap.get(key)!;
          transaction.details.push(detail);
          transaction.totalAmount = Number((transaction.totalAmount + transactionAmount).toFixed(2));
          
          remainingLoss -= transactionAmount;
        }
      });
    });
  });

  // Convert map to array and sort by amount
  const transactions = Array.from(transactionMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  console.log('Generated transactions:', transactions);
  return transactions;
};
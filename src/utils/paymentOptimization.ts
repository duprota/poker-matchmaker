import type { Game, GamePlayer } from "@/types/game";

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

const calculateFinalResult = (player: GamePlayer) => {
  const finalSum = player.final_result || 0;
  const buyIn = player.initial_buyin || 0;
  const rebuys = player.total_rebuys || 0;
  return finalSum - buyIn - (rebuys * buyIn);
};

export const calculateOptimizedPayments = (games: Game[]): Transaction[] => {
  console.log('Starting payment optimization for games:', games);
  
  // Step 1: Create a map to store transactions between player pairs
  const transactionMap = new Map<string, Transaction>();

  // Process each game
  games.forEach(game => {
    const gameTransactions = new Map<string, number>();

    // Calculate net positions for this game
    game.players.forEach(player => {
      const result = calculateFinalResult(player);
      if (result !== 0) {
        // For negative results (losses), create transactions to players with positive results
        if (result < 0) {
          const loserId = player.player.id;
          const loserName = player.player.name;
          const lossAmount = Math.abs(result);

          // Find winners to distribute the loss to
          const winners = game.players.filter(p => calculateFinalResult(p) > 0);
          const totalWinnings = winners.reduce((sum, p) => sum + calculateFinalResult(p), 0);

          winners.forEach(winner => {
            const winnerShare = (calculateFinalResult(winner) / totalWinnings) * lossAmount;
            const key = `${loserId}-${winner.player.id}`;
            
            // Create or update transaction detail
            const detail: PaymentDetail = {
              gameId: game.id,
              gameName: game.name || 'Unnamed Game',
              gameDate: game.date,
              amount: Number(winnerShare.toFixed(2)),
              gamePlayerId: player.id,
              paymentStatus: player.payment_status
            };

            if (!transactionMap.has(key)) {
              transactionMap.set(key, {
                fromPlayer: { id: loserId, name: loserName },
                toPlayer: { id: winner.player.id, name: winner.player.name },
                totalAmount: 0,
                details: []
              });
            }

            const transaction = transactionMap.get(key)!;
            transaction.details.push(detail);
            transaction.totalAmount = Number((transaction.totalAmount + winnerShare).toFixed(2));
          });
        }
      }
    });
  });

  // Convert map to array and sort by amount
  const transactions = Array.from(transactionMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount);

  console.log('Generated transactions:', transactions);
  return transactions;
};
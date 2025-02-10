
import type { Game, GamePlayer } from "@/types/game";
import { calculateFinalResult } from "@/components/games/GameCalculations";

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
  
  // Create a map to store total balances per player across all games
  const playerTotalBalances = new Map<string, number>();
  const playerNames = new Map<string, string>();
  const playerGameDetails = new Map<string, { gameId: string, gamePlayerId: string, paymentStatus: string }[]>();
  
  // Calculate total balances for each player across all games
  games.forEach(game => {
    game.players.forEach(player => {
      const playerId = player.player.id;
      const result = calculateFinalResult(player);
      
      // Store or update player's total balance
      playerTotalBalances.set(
        playerId, 
        (playerTotalBalances.get(playerId) || 0) + result
      );
      
      // Store player name for reference
      playerNames.set(playerId, player.player.name);
      
      // Store game details for this player
      const playerDetails = playerGameDetails.get(playerId) || [];
      playerDetails.push({
        gameId: game.id,
        gamePlayerId: player.id,
        paymentStatus: player.payment_status
      });
      playerGameDetails.set(playerId, playerDetails);
    });
  });
  
  // Create optimized transactions based on total balances
  const transactions: Transaction[] = [];
  const debtors = Array.from(playerTotalBalances.entries())
    .filter(([_, balance]) => balance < 0)
    .map(([id, balance]) => ({
      id,
      amount: Math.abs(balance)
    }))
    .sort((a, b) => b.amount - a.amount);  // Sort by amount descending

  const creditors = Array.from(playerTotalBalances.entries())
    .filter(([_, balance]) => balance > 0)
    .map(([id, balance]) => ({
      id,
      amount: balance
    }))
    .sort((a, b) => b.amount - a.amount);  // Sort by amount descending

  // Match debtors with creditors
  debtors.forEach(debtor => {
    let remainingDebt = debtor.amount;
    
    creditors.forEach(creditor => {
      if (remainingDebt <= 0 || creditor.amount <= 0) return;

      const amount = Math.min(remainingDebt, creditor.amount);
      if (amount <= 0) return;

      // Create the transaction
      transactions.push({
        fromPlayer: {
          id: debtor.id,
          name: playerNames.get(debtor.id) || 'Unknown Player'
        },
        toPlayer: {
          id: creditor.id,
          name: playerNames.get(creditor.id) || 'Unknown Player'
        },
        totalAmount: Number(amount.toFixed(2)),
        details: playerGameDetails.get(debtor.id)?.map(detail => ({
          gameId: detail.gameId,
          gameName: games.find(g => g.id === detail.gameId)?.name || null,
          gameDate: games.find(g => g.id === detail.gameId)?.date || new Date().toISOString(),
          amount: 0, // Individual game amounts are not relevant for the total
          gamePlayerId: detail.gamePlayerId,
          paymentStatus: detail.paymentStatus
        })) || []
      });

      remainingDebt = Number((remainingDebt - amount).toFixed(2));
      creditor.amount = Number((creditor.amount - amount).toFixed(2));
    });
  });

  console.log('Generated transactions:', transactions);
  return transactions;
};

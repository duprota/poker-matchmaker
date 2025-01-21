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
  // Step 1: Calculate net balances between all player pairs across all games
  const netBalances = new Map<string, Map<string, number>>();
  const playerNames = new Map<string, string>();

  games.forEach(game => {
    game.players.forEach(player => {
      const playerId = player.player.id;
      playerNames.set(playerId, player.player.name);
      
      const playerResult = calculateFinalResult(player);
      
      if (playerResult < 0) {
        // Player owes money
        const loserId = player.player.id;
        const loserAmount = Math.abs(playerResult);
        
        // Find winners to distribute the loss
        const winners = game.players.filter(p => calculateFinalResult(p) > 0);
        const totalWinnings = winners.reduce((sum, p) => sum + calculateFinalResult(p), 0);
        
        winners.forEach(winner => {
          const winnerId = winner.player.id;
          const winnerResult = calculateFinalResult(winner);
          const proportion = winnerResult / totalWinnings;
          const amount = loserAmount * proportion;
          
          // Update net balance
          if (!netBalances.has(loserId)) {
            netBalances.set(loserId, new Map());
          }
          if (!netBalances.has(winnerId)) {
            netBalances.set(winnerId, new Map());
          }
          
          const currentBalance = netBalances.get(loserId)!.get(winnerId) || 0;
          netBalances.get(loserId)!.set(winnerId, currentBalance + amount);
        });
      }
    });
  });

  // Step 2: Consolidate balances (if A owes B and B owes A, calculate net difference)
  const consolidatedBalances: PlayerBalance[] = [];
  
  netBalances.forEach((balances, playerId) => {
    let netAmount = 0;
    
    balances.forEach((amount, otherPlayerId) => {
      const reverseAmount = netBalances.get(otherPlayerId)?.get(playerId) || 0;
      const netDifference = amount - reverseAmount;
      
      if (netDifference > 0) {
        netAmount -= netDifference;
      }
    });
    
    if (netAmount !== 0) {
      consolidatedBalances.push({
        playerId,
        playerName: playerNames.get(playerId) || 'Unknown Player',
        balance: netAmount
      });
    }
  });

  // Step 3: Create optimized transactions
  const transactions: Transaction[] = [];
  const debtors = consolidatedBalances.filter(p => p.balance < 0)
    .sort((a, b) => a.balance - b.balance);
  const creditors = consolidatedBalances.filter(p => p.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];
    
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    
    if (amount > 0) {
      // Create transaction with game details
      const details: PaymentDetail[] = [];
      games.forEach(game => {
        const debtorPlayer = game.players.find(p => p.player.id === debtor.playerId);
        const creditorPlayer = game.players.find(p => p.player.id === creditor.playerId);
        
        if (debtorPlayer && creditorPlayer) {
          const debtorResult = calculateFinalResult(debtorPlayer);
          const creditorResult = calculateFinalResult(creditorPlayer);
          
          if (debtorResult < 0 && creditorResult > 0) {
            details.push({
              gameId: game.id,
              gameName: game.name,
              gameDate: game.date,
              amount: Math.abs(debtorResult),
              gamePlayerId: debtorPlayer.id,
              paymentStatus: debtorPlayer.payment_status
            });
          }
        }
      });

      transactions.push({
        fromPlayer: {
          id: debtor.playerId,
          name: debtor.playerName
        },
        toPlayer: {
          id: creditor.playerId,
          name: creditor.playerName
        },
        totalAmount: amount,
        details
      });
    }
    
    debtor.balance += amount;
    creditor.balance -= amount;
    
    if (Math.abs(debtor.balance) < 0.01) debtorIdx++;
    if (Math.abs(creditor.balance) < 0.01) creditorIdx++;
  }

  return transactions;
};
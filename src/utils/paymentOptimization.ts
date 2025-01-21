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
  
  // Step 1: Calculate net balances between all player pairs across all games
  const playerBalances = new Map<string, number>();
  const playerNames = new Map<string, string>();
  const gameDetails = new Map<string, Map<string, PaymentDetail[]>>();

  // First, calculate total balance for each player across all games
  games.forEach(game => {
    game.players.forEach(player => {
      const playerId = player.player.id;
      playerNames.set(playerId, player.player.name);
      
      const result = calculateFinalResult(player);
      const currentBalance = playerBalances.get(playerId) || 0;
      playerBalances.set(playerId, currentBalance + result);

      // Store game details for later use
      if (result < 0) {
        const detail: PaymentDetail = {
          gameId: game.id,
          gameName: game.name,
          gameDate: game.date,
          amount: Math.abs(result),
          gamePlayerId: player.id,
          paymentStatus: player.payment_status
        };

        game.players.forEach(otherPlayer => {
          if (otherPlayer.player.id !== playerId && calculateFinalResult(otherPlayer) > 0) {
            const key = `${playerId}-${otherPlayer.player.id}`;
            if (!gameDetails.has(key)) {
              gameDetails.set(key, new Map());
            }
            const details = gameDetails.get(key)!.get(game.id) || [];
            details.push(detail);
            gameDetails.get(key)!.set(game.id, details);
          }
        });
      }
    });
  });

  console.log('Player balances:', Object.fromEntries(playerBalances));

  // Convert to array for sorting
  const sortedPlayers = Array.from(playerBalances.entries())
    .map(([playerId, balance]) => ({
      playerId,
      playerName: playerNames.get(playerId) || 'Unknown',
      balance
    }))
    .sort((a, b) => a.balance - b.balance);

  const debtors = sortedPlayers.filter(p => p.balance < 0);
  const creditors = sortedPlayers.filter(p => p.balance > 0);

  console.log('Debtors:', debtors);
  console.log('Creditors:', creditors);

  const transactions: Transaction[] = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];
    
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    
    if (amount > 0) {
      const key = `${debtor.playerId}-${creditor.playerId}`;
      const details: PaymentDetail[] = [];
      
      // Collect all game details for this pair
      gameDetails.get(key)?.forEach((gameDetailList, gameId) => {
        details.push(...gameDetailList);
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
        totalAmount: Number(amount.toFixed(2)), // Round to 2 decimal places
        details
      });

      // Update balances
      debtor.balance += amount;
      creditor.balance -= amount;
    }
    
    // Move to next player if their balance is settled
    if (Math.abs(debtor.balance) < 0.01) debtorIdx++;
    if (Math.abs(creditor.balance) < 0.01) creditorIdx++;
  }

  console.log('Generated transactions:', transactions);
  return transactions;
};
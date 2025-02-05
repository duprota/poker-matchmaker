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
  
  // Step 1: Calculate total balances for each player across all games
  const playerBalances = new Map<string, { balance: number; name: string }>();
  
  games.forEach(game => {
    game.players.forEach(player => {
      const result = calculateFinalResult(player);
      const currentBalance = playerBalances.get(player.player.id);
      
      if (currentBalance) {
        currentBalance.balance += result;
      } else {
        playerBalances.set(player.player.id, {
          balance: result,
          name: player.player.name
        });
      }
    });
  });

  console.log('Player balances:', Array.from(playerBalances.entries()));

  // Step 2: Separate players into debtors and creditors
  const debtors = Array.from(playerBalances.entries())
    .filter(([_, data]) => data.balance < 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      amount: Math.abs(data.balance)
    }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Array.from(playerBalances.entries())
    .filter(([_, data]) => data.balance > 0)
    .map(([id, data]) => ({
      id,
      name: data.name,
      amount: data.balance
    }))
    .sort((a, b) => b.amount - a.amount);

  console.log('Debtors:', debtors);
  console.log('Creditors:', creditors);

  // Step 3: Create a map to store transactions between player pairs
  const transactionMap = new Map<string, Transaction>();

  // Step 4: For each game, create detailed transaction records
  games.forEach(game => {
    const gameDebtors = game.players
      .filter(p => calculateFinalResult(p) < 0)
      .map(p => ({
        id: p.player.id,
        name: p.player.name,
        gamePlayerId: p.id,
        amount: Math.abs(calculateFinalResult(p)),
        paymentStatus: p.payment_status
      }));

    const gameCreditors = game.players
      .filter(p => calculateFinalResult(p) > 0)
      .map(p => ({
        id: p.player.id,
        name: p.player.name,
        amount: calculateFinalResult(p)
      }));

    // Distribute each debtor's amount among creditors proportionally
    gameDebtors.forEach(debtor => {
      let remainingDebt = debtor.amount;
      const totalCredits = gameCreditors.reduce((sum, c) => sum + c.amount, 0);

      gameCreditors.forEach(creditor => {
        if (remainingDebt <= 0) return;

        // Calculate this creditor's share of the debt
        const share = (creditor.amount / totalCredits) * debtor.amount;
        const amount = Math.min(remainingDebt, share);

        if (amount > 0) {
          const key = `${debtor.id}-${creditor.id}`;
          
          // Create or update transaction detail
          const detail: PaymentDetail = {
            gameId: game.id,
            gameName: game.name || null,
            gameDate: game.date,
            amount: Number(amount.toFixed(2)),
            gamePlayerId: debtor.gamePlayerId,
            paymentStatus: debtor.paymentStatus
          };

          if (!transactionMap.has(key)) {
            transactionMap.set(key, {
              fromPlayer: { id: debtor.id, name: debtor.name },
              toPlayer: { id: creditor.id, name: creditor.name },
              totalAmount: 0,
              details: []
            });
          }

          const transaction = transactionMap.get(key)!;
          transaction.details.push(detail);
          transaction.totalAmount = Number((transaction.totalAmount + amount).toFixed(2));
          
          remainingDebt -= amount;
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
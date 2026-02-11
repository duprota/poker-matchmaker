import type { PlayerBalance } from "@/types/ledger";

interface SettlementTransaction {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

/**
 * Greedy algorithm to minimize the number of P2P transactions
 * needed to settle all balances.
 * 
 * Players with negative balance (debtors) pay players with positive balance (creditors).
 * The algorithm sorts both groups by amount descending and matches them greedily.
 */
export const calculateMinimizedSettlements = (
  balances: PlayerBalance[]
): SettlementTransaction[] => {
  const EPSILON = 0.01;

  const debtors = balances
    .filter(b => b.balance < -EPSILON)
    .map(b => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter(b => b.balance > EPSILON)
    .map(b => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions: SettlementTransaction[] = [];

  let ci = 0;
  let di = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > EPSILON) {
      transactions.push({
        fromPlayerId: debtor.playerId,
        fromPlayerName: debtor.playerName,
        toPlayerId: creditor.playerId,
        toPlayerName: creditor.playerName,
        amount: Number(amount.toFixed(2)),
      });
    }

    debtor.remaining = Number((debtor.remaining - amount).toFixed(2));
    creditor.remaining = Number((creditor.remaining - amount).toFixed(2));

    if (debtor.remaining < EPSILON) di++;
    if (creditor.remaining < EPSILON) ci++;
  }

  return transactions;
};

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

interface PlayerBalance {
  playerId: string;
  playerName: string;
  balance: number;
}

export const calculateMinimumTransactions = (players: PlayerBalance[]): Transaction[] => {
  console.log("Calculating minimum transactions for players:", players);
  
  // Separate players into debtors and creditors
  const debtors = players.filter(p => p.balance < 0)
    .sort((a, b) => a.balance - b.balance); // Sort by debt (ascending)
  const creditors = players.filter(p => p.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Sort by credit (descending)
  
  const transactions: Transaction[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    // Get absolute values
    const debtAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;
    
    // Calculate transaction amount
    const transactionAmount = Math.min(debtAmount, creditAmount);
    
    if (transactionAmount > 0) {
      transactions.push({
        from: debtor.playerId,
        to: creditor.playerId,
        amount: transactionAmount
      });
    }
    
    // Update balances
    debtor.balance += transactionAmount;
    creditor.balance -= transactionAmount;
    
    // Move to next player if their balance is settled
    if (Math.abs(debtor.balance) < 0.01) debtorIndex++;
    if (Math.abs(creditor.balance) < 0.01) creditorIndex++;
  }
  
  console.log("Calculated transactions:", transactions);
  return transactions;
};
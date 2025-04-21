
interface PlayerStatsProps {
  totalAmount: number;
  totalRebuys: number;
}

export const PlayerStats = ({ totalAmount, totalRebuys }: PlayerStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Total Amount</p>
        <p className="text-2xl font-bold">${totalAmount}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Rebuys</p>
        <p className="text-2xl font-bold">{totalRebuys}</p>
      </div>
    </div>
  );
};

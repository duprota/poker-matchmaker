import { Navigation } from "@/components/Navigation";
import { PlayerBalancesCard } from "@/components/financials/PlayerBalancesCard";
import { SettlementCard } from "@/components/financials/SettlementCard";
import { usePlayerBalances } from "@/hooks/useLedger";
import {
  useActiveSettlement,
  useCreateSettlement,
  useMarkSettlementPaid,
  useUnmarkSettlementPaid,
} from "@/hooks/useSettlement";
import type { SettlementItem } from "@/types/ledger";

const Financials = () => {
  const { data: balances = [], isLoading: balancesLoading } = usePlayerBalances();
  const { data: settlement, isLoading: settlementLoading } = useActiveSettlement();
  const createSettlement = useCreateSettlement();
  const markPaid = useMarkSettlementPaid();
  const unmarkPaid = useUnmarkSettlementPaid();

  const handleGenerateSettlement = () => {
    createSettlement.mutate(balances);
  };

  const handleMarkPaid = (item: any) => {
    markPaid.mutate({
      id: item.id,
      fromPlayerId: item.from_player_id,
      toPlayerId: item.to_player_id,
      amount: Number(item.amount),
      fromPlayerName: item.from_player?.name || "",
      toPlayerName: item.to_player?.name || "",
    });
  };

  const handleUnmarkPaid = (itemId: string) => {
    unmarkPaid.mutate(itemId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-6 px-4 max-w-lg space-y-4">
        <h1 className="text-xl font-bold">Ajustes Financeiros</h1>

        <PlayerBalancesCard balances={balances} isLoading={balancesLoading} />

        <SettlementCard
          settlement={settlement}
          isCreating={createSettlement.isPending}
          onGenerateSettlement={handleGenerateSettlement}
          onMarkPaid={handleMarkPaid}
          onUnmarkPaid={handleUnmarkPaid}
        />
      </div>
    </div>
  );
};

export default Financials;

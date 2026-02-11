import { Card } from "@/components/ui/card";
import { PlayerBalance } from "@/types/ledger";
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react";

interface PlayerBalancesCardProps {
  balances: PlayerBalance[];
  isLoading: boolean;
}

export const PlayerBalancesCard = ({ balances, isLoading }: PlayerBalancesCardProps) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Saldos dos Jogadores</h2>
        <p className="text-muted-foreground text-center py-4">Carregando...</p>
      </Card>
    );
  }

  const sorted = [...balances]
    .filter((p) => Math.abs(p.balance) >= 0.01)
    .sort((a, b) => b.balance - a.balance);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Saldos dos Jogadores</h2>
      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                {player.balance > 0 ? (
                  <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : player.balance < 0 ? (
                  <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : (
                  <MinusCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-medium block">{player.playerName}</span>
                  {player.pixKey && (
                    <span className="text-xs text-muted-foreground block truncate">
                      Pix: {player.pixKey}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`font-mono font-semibold shrink-0 ${
                  player.balance > 0
                    ? "text-green-500"
                    : player.balance < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {player.balance > 0 ? "+" : ""}
                {player.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

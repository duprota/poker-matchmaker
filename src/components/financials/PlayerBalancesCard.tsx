import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlayerBalance } from "@/types/ledger";
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react";

interface PlayerBalancesCardProps {
  balances: PlayerBalance[];
  isLoading: boolean;
}

export const PlayerBalancesCard = ({ balances, isLoading }: PlayerBalancesCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saldos dos Jogadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...balances]
    .filter((p) => Math.abs(p.balance) >= 0.01)
    .sort((a, b) => b.balance - a.balance);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saldos dos Jogadores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhum lançamento encontrado.</p>
        ) : (
          sorted.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {player.balance > 0 ? (
                  <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : player.balance < 0 ? (
                  <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : (
                  <MinusCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm break-words">{player.playerName}</span>
              </div>
              <span
                className={`font-mono font-semibold text-sm shrink-0 ml-3 ${
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
          ))
        )}
      </CardContent>
    </Card>
  );
};

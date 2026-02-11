import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Undo2, RefreshCw, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { SettlementItem } from "@/types/ledger";

interface SettlementCardProps {
  settlement: any;
  isCreating: boolean;
  onGenerateSettlement: () => void;
  onMarkPaid: (item: SettlementItem) => void;
  onUnmarkPaid: (itemId: string) => void;
}

export const SettlementCard = ({
  settlement,
  isCreating,
  onGenerateSettlement,
  onMarkPaid,
  onUnmarkPaid,
}: SettlementCardProps) => {
  const items: SettlementItem[] = settlement?.settlement_items || [];
  const pendingItems = items.filter((i: any) => !i.paid_at);
  const paidItems = items.filter((i: any) => i.paid_at);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Ajuste de Contas</h2>
        <Button
          onClick={onGenerateSettlement}
          disabled={isCreating}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isCreating ? "animate-spin" : ""}`} />
          {settlement ? "Recalcular" : "Gerar Ajuste"}
        </Button>
      </div>

      {!settlement ? (
        <p className="text-muted-foreground text-center py-6">
          Nenhum ajuste ativo. Clique em "Gerar Ajuste" para calcular.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Gerado em {format(new Date(settlement.created_at), "dd/MM/yyyy HH:mm")}
          </p>

          {pendingItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Pendentes</h3>
              {pendingItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                >
                  <div className="flex flex-col gap-0.5 text-sm flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.from_player?.name}</span>
                      <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{item.to_player?.name}</span>
                    </div>
                    {item.to_player?.pix_key && (
                      <span className="text-xs text-muted-foreground truncate">
                        Pix: {item.to_player.pix_key}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono font-semibold text-sm whitespace-nowrap">
                      {Number(item.amount).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      onClick={() => onMarkPaid(item)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Pago
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {paidItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Pagos</h3>
              {paidItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md border bg-muted/30 opacity-70"
                >
                  <div className="flex flex-col gap-0.5 text-sm flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{item.from_player?.name}</span>
                      <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.to_player?.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Pago
                      </Badge>
                    </div>
                    {item.to_player?.pix_key && (
                      <span className="text-xs text-muted-foreground truncate">
                        Pix: {item.to_player.pix_key}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-mono text-sm whitespace-nowrap">
                      {Number(item.amount).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => onUnmarkPaid(item.id)}
                    >
                      <Undo2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Todos os saldos estão zerados.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

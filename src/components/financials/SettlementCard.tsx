import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Undo2, RefreshCw, Copy } from "lucide-react";
import { format } from "date-fns";
import type { SettlementItem } from "@/types/ledger";
import { toast } from "sonner";

interface SettlementCardProps {
  settlement: any;
  isCreating: boolean;
  onGenerateSettlement: () => void;
  onMarkPaid: (item: SettlementItem) => void;
  onUnmarkPaid: (itemId: string) => void;
}

const copyPix = (pixKey: string) => {
  navigator.clipboard.writeText(pixKey);
  toast.success("Chave Pix copiada!");
};

const TransactionCard = ({
  item,
  isPaid,
  onAction,
}: {
  item: any;
  isPaid: boolean;
  onAction: () => void;
}) => (
  <div
    className={`rounded-lg border p-3 space-y-2.5 ${
      isPaid ? "bg-muted/30 opacity-70" : "bg-card"
    }`}
  >
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
      {/* From player */}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">De</p>
        <p className="text-sm font-medium break-words">{item.from_player?.name}</p>
      </div>

      {/* Arrow / Amount */}
      <div className="flex flex-col items-center pt-3">
        <span className="font-mono font-bold text-base">
          R$ {Number(item.amount).toFixed(2)}
        </span>
      </div>

      {/* To player */}
      <div className="min-w-0 text-right">
        <p className="text-xs text-muted-foreground mb-0.5">Para</p>
        <p className="text-sm font-medium break-words">{item.to_player?.name}</p>
      </div>
    </div>

    {/* Pix + Action row */}
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
      {item.to_player?.pix_key ? (
        <button
          onClick={() => copyPix(item.to_player.pix_key)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          <Copy className="w-3 h-3 shrink-0" />
          <span className="truncate">Pix: {item.to_player.pix_key}</span>
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">Sem chave Pix</span>
      )}

      {isPaid ? (
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs">Pago</Badge>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onAction}>
            <Undo2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-7 px-2.5 shrink-0" onClick={onAction}>
          <Check className="w-3 h-3 mr-1" />
          Pago
        </Button>
      )}
    </div>
  </div>
);

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ajuste de Contas</CardTitle>
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
      </CardHeader>

      <CardContent>
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
                <div className="space-y-2">
                  {pendingItems.map((item: any) => (
                    <TransactionCard
                      key={item.id}
                      item={item}
                      isPaid={false}
                      onAction={() => onMarkPaid(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {paidItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Pagos</h3>
                <div className="space-y-2">
                  {paidItems.map((item: any) => (
                    <TransactionCard
                      key={item.id}
                      item={item}
                      isPaid={true}
                      onAction={() => onUnmarkPaid(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Todos os saldos estão zerados.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

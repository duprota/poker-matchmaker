import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: boolean;
  name: string;
  avatarUrl?: string | null;
  invested: number;
  rebuys: number;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  saving: boolean;
  editing: boolean;
  error: string | null;
}

export function CashOutDialog({ open, onOpenChange, mobile, name, avatarUrl, invested, rebuys, value, onValueChange, onConfirm, saving, editing, error }: CashOutDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const parsedValue = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(parsedValue) && parsedValue >= 0;
  const balance = valid ? parsedValue - invested : null;
  const money = (amount: number) => `$${amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;

  useEffect(() => {
    if (!open || !mobile) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      const content = contentRef.current;
      if (!content) return;
      content.style.setProperty("--cashout-visible-height", `${viewport?.height ?? window.innerHeight}px`);
      content.style.setProperty("--cashout-viewport-top", `${viewport?.offsetTop ?? 0}px`);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [open, mobile]);

  return <Dialog open={open} onOpenChange={next => { if (!saving) onOpenChange(next); }}>
    <DialogContent
      ref={contentRef}
      className={`cashout-dialog flex flex-col overflow-hidden gap-0 p-0 rounded-lg w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[calc(100dvh-2rem)] ${mobile ? "cashout-mobile-content" : ""} ${saving ? "[&>button]:hidden" : ""}`}
      onOpenAutoFocus={event => { if (mobile) event.preventDefault(); }}
      onEscapeKeyDown={event => { if (saving) event.preventDefault(); }}
      onInteractOutside={event => { if (saving) event.preventDefault(); }}
    >
      <form className="flex min-h-0 flex-col" aria-busy={saving} onSubmit={event => { event.preventDefault(); if (valid && !saving) onConfirm(); }}>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold pr-10 tracking-normal">{editing ? "Editar saída" : "Registrar saída"}</DialogTitle>
          <div className="flex items-center gap-3 mt-5 mb-5">
            <Avatar className="h-12 w-12 rounded-lg border">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="rounded-lg">{name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold break-words">{name}</p>
              <DialogDescription className="mt-1">Investido {money(invested)} · {rebuys} rebuys</DialogDescription>
            </div>
          </div>
          <label htmlFor="cashout-final-chips" className="text-sm font-medium block mb-2">Fichas finais ($)</label>
          <div className="flex items-center gap-2">
            <Input id="cashout-final-chips" type="number" inputMode="decimal" min="0" step="any"
              value={value} onChange={event => onValueChange(event.target.value)}
              disabled={saving} placeholder="0,00" className="h-14 text-2xl min-w-0 tabular-nums" autoFocus={!mobile} />
            <Button type="button" variant="outline" className="h-14 shrink-0" disabled={saving} onClick={() => onValueChange("0")}>Zerou</Button>
          </div>
          <div className={`cashout-result h-[80px] mt-4 p-3 rounded-lg ${balance === null ? "bg-muted" : balance >= 0 ? "cashout-result-positive" : "cashout-result-negative"}`}>
            <p className="text-sm">Saldo da partida</p>
            <p className="text-2xl font-bold tabular-nums">{balance === null ? "—" : `${balance >= 0 ? "+" : "−"}${money(Math.abs(balance))}`}</p>
          </div>
          <div className="min-h-[48px] pt-2 text-sm text-destructive" aria-live="polite"><span role={error ? "alert" : undefined}>{error}</span></div>
        </div>
        <div className="cashout-actions grid grid-cols-[auto_1fr] shrink-0 gap-2 border-t bg-background px-5 pt-4">
          <Button type="button" variant="outline" className="h-12" disabled={saving} onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" className="h-12 min-w-0" disabled={!valid || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : <Check className="h-4 w-4 mr-2 shrink-0" />}
            {saving ? "Salvando…" : editing ? "Salvar alterações" : "Registrar saída"}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

import { useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";

interface CashOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: boolean;
  name: string;
  invested: number;
  rebuys: number;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  saving: boolean;
}

export function CashOutDialog({ open, onOpenChange, mobile, name, invested, rebuys, value, onValueChange, onConfirm, saving }: CashOutDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const parsedValue = Number.parseFloat(value);
  const valid = value !== "" && Number.isFinite(parsedValue) && parsedValue >= 0;
  const balance = valid ? parsedValue - invested : null;

  useEffect(() => {
    if (!open || !mobile) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      const content = contentRef.current;
      if (!content) return;
      const height = viewport?.height ?? window.innerHeight;
      const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0));
      content.style.setProperty("--cashout-visible-height", `${height}px`);
      content.style.setProperty("--cashout-keyboard-offset", `${bottom}px`);
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

  const Title = mobile ? DrawerTitle : DialogTitle;
  const Description = mobile ? DrawerDescription : DialogDescription;
  const form = <>
    <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pt-4 pb-4">
      <Title className="text-xl font-bold mb-2">Encerrar {name}</Title>
      <Description className="text-sm text-muted-foreground mb-4">
        Total investido: ${invested} (buy-in + {rebuys} rebuys)
      </Description>
      <label className="text-sm font-medium mb-1 block">
        Stack final ($)
        <Input
          type="number" inputMode="decimal" min="0" step="any"
          value={value} onChange={event => onValueChange(event.target.value)}
          placeholder="Valor do stack final" className="h-12 text-lg mt-1"
          autoFocus={!mobile}
        />
      </label>
      <div className={`cashout-result min-h-[72px] mt-4 p-3 rounded-lg ${balance === null ? "bg-muted" : balance >= 0 ? "cashout-result-positive" : "cashout-result-negative"}`}>
        <p className="text-sm">Resultado líquido</p>
        <p className="text-xl font-bold">{balance === null ? "—" : `${balance >= 0 ? "+" : ""}$${balance}`}</p>
      </div>
    </div>
    <div className="cashout-actions flex shrink-0 justify-end gap-2 border-t bg-background px-6 pt-4">
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
      <Button onClick={onConfirm} disabled={!valid || saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
        Confirmar
      </Button>
    </div>
  </>;

  if (mobile) return <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false} shouldScaleBackground={false} handleOnly>
    <DrawerContent ref={contentRef} className="cashout-mobile-content overflow-hidden" onOpenAutoFocus={event => event.preventDefault()}>
      {form}
    </DrawerContent>
  </Drawer>;

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden gap-0 p-0 sm:max-w-[425px]">
      {form}
    </DialogContent>
  </Dialog>;
}
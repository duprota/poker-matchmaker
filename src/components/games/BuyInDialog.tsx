import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { GamePlayer } from '@/types/game';
import { parseBuyIn, previewBuyIn } from './buyInCorrection';

interface Props {
  player: GamePlayer | null;
  onClose: () => void;
  onSave: (id: string, amount: number) => Promise<void>;
}

export function BuyInDialog({ player, onClose, onSave }: Props) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setValue(player ? String(player.initial_buyin) : '');
    setError(null);
  }, [player?.id]);
  useEffect(() => {
    if (!player || !mobile) return;
    const viewport = window.visualViewport;
    const update = () => {
      ref.current?.style.setProperty('--cashout-visible-height', `${viewport?.height ?? window.innerHeight}px`);
      ref.current?.style.setProperty('--cashout-viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    const frame = requestAnimationFrame(update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, [player?.id, mobile]);
  const amount = parseBuyIn(value);
  const preview = player && amount !== null ? previewBuyIn(amount, player.total_rebuys, player.final_result) : null;
  const money = (amount: number) => `$${amount.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
  const save = async () => {
    if (!player || amount === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(player.id, amount);
      onClose();
    } catch {
      setError('Não foi possível salvar. Confira o valor e tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={!!player} onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent ref={ref} className={`flex flex-col overflow-hidden gap-0 p-0 rounded-lg w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[calc(100dvh-2rem)] ${mobile ? 'cashout-mobile-content' : ''} ${saving ? '[&>button]:hidden' : ''}`}
      onOpenAutoFocus={event => { if (mobile) event.preventDefault(); }}
      onEscapeKeyDown={event => { if (saving) event.preventDefault(); }}
      onInteractOutside={event => { if (saving) event.preventDefault(); }}>
      <form className="flex min-h-0 flex-col" aria-busy={saving} onSubmit={event => { event.preventDefault(); void save(); }}>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 pb-2">
          <DialogTitle className="text-xl pr-10">Corrigir buy-in</DialogTitle>
          <DialogDescription className="mt-2 mb-5">{player?.player.name} · {player?.total_rebuys} rebuys</DialogDescription>
          <label htmlFor="correct-buyin" className="block text-sm font-medium mb-2">Buy-in ($)</label>
          <Input id="correct-buyin" inputMode="decimal" value={value} onChange={event => { setValue(event.target.value); setError(null); }} disabled={saving} className="h-14 text-2xl" autoFocus={!mobile} />
          <p className="text-sm text-muted-foreground mt-2">O mesmo valor é usado para cada rebuy. As fichas finais não serão alteradas.</p>
          <div className="bg-muted rounded-lg p-3 mt-4 space-y-2 h-[88px] tabular-nums">
            <p className="flex justify-between"><span>Total investido</span><strong>{preview ? money(preview.invested) : '—'}</strong></p>
            <p className="flex justify-between"><span>Saldo da partida</span><strong>{preview?.balance != null ? money(preview.balance) : '—'}</strong></p>
          </div>
          <div className="min-h-[48px] pt-2 text-sm text-destructive" aria-live="polite">{error}</div>
        </div>
        <div className="cashout-actions grid grid-cols-[auto_1fr] shrink-0 gap-2 border-t bg-background px-5 pt-4">
          <Button type="button" variant="outline" className="h-12" disabled={saving} onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-12" disabled={amount === null || saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{saving ? 'Salvando…' : 'Salvar alterações'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
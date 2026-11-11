import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { gameCorrection } from '@/lib/gameCorrection';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';

export function GameCorrectionControl({ gameId, status, refresh }: { gameId: string; status: string; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const client = useQueryClient();
  const { data: job } = useQuery({
    queryKey: ['game-reconciliation', gameId],
    queryFn: async () => {
      const { data, error } = await supabase.from('game_reconciliation_jobs').select('*').eq('game_id', gameId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: query => query.state.data?.status === 'completed' ? false : 2500,
  });
  const busy = job?.status === 'queued' || job?.status === 'running';
  const completedJob = useRef<string>();
  useEffect(() => {
    if (job?.status !== 'completed' || completedJob.current === job.id) return;
    completedJob.current = job.id;
    void client.invalidateQueries({ predicate: query => query.queryKey[0] !== 'game-reconciliation' });
    void refresh();
  }, [job?.id, job?.status, client, refresh]);
  const act = async (action: 'reopen' | 'retry' | 'resume') => {
    setSaving(true); setError('');
    try {
      await gameCorrection(action, action === 'reopen' ? { game_id: gameId } : { job_id: job?.id });
      await refresh(); await client.invalidateQueries(); setOpen(false);
      toast.success(action === 'reopen' ? 'Jogo reaberto. Rankings em atualização.' : 'Recálculo retomado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível reabrir.'); }
    finally { setSaving(false); }
  };
  return <div className="space-y-2">
    {status === 'completed' && !busy && <Button variant="outline" onClick={() => setOpen(true)}><RotateCcw className="mr-2 h-4 w-4" />Reabrir jogo</Button>}
    {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Atualizando rankings e estatísticas… {job.cursor} partidas</p>}
    {busy && job.updated_at && Date.now() - new Date(job.updated_at).getTime() > 300000 && <Button variant="outline" disabled={saving} onClick={() => void act('resume')}>Retomar atualização</Button>}
    {job?.status === 'error' && <div role="alert" className="space-y-2 text-sm text-destructive"><p>A alteração foi salva, mas os rankings ainda precisam ser atualizados.</p><Button variant="outline" disabled={saving} onClick={() => void act('retry')}>Tentar recálculo novamente</Button></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <AlertDialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reabrir esta partida?</AlertDialogTitle><AlertDialogDescription>Os valores ficam preenchidos para correção. Rankings e propostas de acerto serão atualizados; despesas e pagamentos já realizados serão preservados.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel><Button disabled={saving} onClick={() => void act('reopen')}>{saving ? 'Reabrindo…' : 'Confirmar reabertura'}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
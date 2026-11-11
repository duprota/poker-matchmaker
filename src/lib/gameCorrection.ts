import { supabase } from '@/integrations/supabase/client';

export async function gameCorrection(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('game-correction', { body: { action, ...payload } });
  if (error) {
    let message = error.message;
    if ('context' in error && error.context instanceof Response) {
      try { const body = await error.context.json(); message = body.error ?? message; } catch { /* Keep original error. */ }
    }
    throw new Error(message);
  }
  if (!data?.success || data.error) throw new Error(data?.error ?? 'A alteração não foi confirmada.');
  return data as { id: string; success: boolean };
}
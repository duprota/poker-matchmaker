import { useEffect, useRef, useState } from "react";
import type { GamePlayer } from "@/types/game";
import { applyCashOuts, reconcileCashOuts, type CashOutOverrides } from "./cashOutState";

export function useOptimisticCashOut(gameId: string, players: GamePlayer[]) {
  const [overrides, setOverrides] = useState<CashOutOverrides>({});
  const pending = useRef(new Set<string>());

  useEffect(() => {
    pending.current.clear();
    setOverrides({});
  }, [gameId]);

  useEffect(() => {
    setOverrides(previous => reconcileCashOuts(players, previous));
  }, [players]);

  const save = async (id: string, value: number, persist: () => Promise<void>) => {
    if (pending.current.has(id)) throw new Error("Cashout already pending");
    if (!Number.isFinite(value) || value < 0) throw new Error("Invalid final stack");
    pending.current.add(id);
    setOverrides(previous => ({ ...previous, [id]: { value, saving: true } }));
    try {
      await persist();
      setOverrides(previous => ({ ...previous, [id]: { value, saving: false } }));
    } catch (error) {
      setOverrides(previous => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      throw error;
    } finally {
      pending.current.delete(id);
    }
  };

  return { players: applyCashOuts(players, overrides), overrides, save };
}
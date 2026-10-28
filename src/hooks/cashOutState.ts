import type { GamePlayer } from "@/types/game";

export interface CashOutOverride {
  value: number;
  saving: boolean;
}

export type CashOutOverrides = Record<string, CashOutOverride>;

export function applyCashOuts(players: GamePlayer[], overrides: CashOutOverrides): GamePlayer[] {
  return players.map(player => overrides[player.id]
    ? { ...player, final_result: overrides[player.id].value }
    : player);
}

export function reconcileCashOuts(players: GamePlayer[], overrides: CashOutOverrides): CashOutOverrides {
  const next = { ...overrides };
  for (const [id, override] of Object.entries(overrides)) {
    if (!override.saving && players.some(player => player.id === id && player.final_result === override.value)) {
      delete next[id];
    }
  }
  return Object.keys(next).length === Object.keys(overrides).length ? overrides : next;
}
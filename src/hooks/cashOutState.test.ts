import { describe, expect, test } from "bun:test";
import { applyCashOuts, reconcileCashOuts } from "./cashOutState";
import type { GamePlayer } from "@/types/game";

const players: GamePlayer[] = ["flavio", "bruno"].map(id => ({
  id, game_id: "game", player: { id, name: id, email: "" },
  initial_buyin: 100, total_rebuys: 2, final_result: null,
  payment_status: "pending", payment_amount: 0,
}));

describe("optimistic cashout", () => {
  test("immediately displays 567 chips while preserving other players", () => {
    const result = applyCashOuts(players, { flavio: { value: 567, saving: true } });
    expect(result[0].final_result).toBe(567);
    expect(result[1].final_result).toBeNull();
    expect(players[0].final_result).toBeNull();
  });
  test("zero chips is an exit, not an absent result", () => {
    expect(applyCashOuts(players, { flavio: { value: 0, saving: true } })[0].final_result).toBe(0);
  });
  test("stale server data cannot cancel an exit", () => {
    expect(reconcileCashOuts(players, { flavio: { value: 567, saving: false } }).flavio.value).toBe(567);
  });
  test("only the confirmed player is reconciled", () => {
    const server = players.map(p => p.id === "flavio" ? { ...p, final_result: 567 } : p);
    const result = reconcileCashOuts(server, {
      flavio: { value: 567, saving: false }, bruno: { value: 0, saving: true },
    });
    expect(result.flavio).toBeUndefined();
    expect(result.bruno).toEqual({ value: 0, saving: true });
  });
  test("a matching read does not unlock a write still in progress", () => {
    const server = players.map(p => ({ ...p, final_result: 567 }));
    expect(reconcileCashOuts(server, { flavio: { value: 567, saving: true } }).flavio.saving).toBe(true);
  });
});
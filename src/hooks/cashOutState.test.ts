import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
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
    assert.equal(result[0].final_result, 567);
    assert.equal(result[1].final_result, null);
    assert.equal(players[0].final_result, null);
  });
  test("zero chips is an exit, not an absent result", () => {
    assert.equal(applyCashOuts(players, { flavio: { value: 0, saving: true } })[0].final_result, 0);
  });
  test("stale server data cannot cancel an exit", () => {
    assert.equal(reconcileCashOuts(players, { flavio: { value: 567, saving: false } }).flavio.value, 567);
  });
  test("only the confirmed player is reconciled", () => {
    const server = players.map(p => p.id === "flavio" ? { ...p, final_result: 567 } : p);
    const result = reconcileCashOuts(server, {
      flavio: { value: 567, saving: false }, bruno: { value: 0, saving: true },
    });
    assert.equal(result.flavio, undefined);
    assert.deepEqual(result.bruno, { value: 0, saving: true });
  });
  test("a matching read does not unlock a write still in progress", () => {
    const server = players.map(p => ({ ...p, final_result: 567 }));
    assert.equal(reconcileCashOuts(server, { flavio: { value: 567, saving: true } }).flavio.saving, true);
  });
});
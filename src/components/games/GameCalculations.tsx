import { GamePlayer } from "@/types/game";

export const calculateTotalBuyInsAndRebuys = (players: GamePlayer[]) => {
  return players.reduce((acc, player) => {
    return acc + player.initial_buyin + (player.total_rebuys * player.initial_buyin);
  }, 0);
};

export const calculateTotalResults = (players: GamePlayer[]) => {
  return players.reduce((acc, player) => {
    return acc + (player.final_result || 0);
  }, 0);
};

export const calculateFinalResult = (player: GamePlayer) => {
  const finalSum = player.final_result || 0;
  const buyIn = player.initial_buyin || 0;
  const rebuys = player.total_rebuys || 0;
  return finalSum - buyIn - (rebuys * buyIn);
};

export const calculateTotals = (players: GamePlayer[]) => {
  const totals = {
    buyIns: 0,
    rebuys: 0,
    finalSum: 0,
    finalResult: 0
  };

  players.forEach(player => {
    totals.buyIns += player.initial_buyin;
    totals.rebuys += player.total_rebuys * player.initial_buyin;
    totals.finalSum += player.final_result || 0;
    totals.finalResult += calculateFinalResult(player);
  });

  return totals;
};
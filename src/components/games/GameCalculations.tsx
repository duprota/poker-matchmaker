import { GamePlayer } from "@/types/game";

export const calculateTotalBuyInsAndRebuys = (players: GamePlayer[]) => {
  return players.reduce((acc, player) => {
    const initialBuyin = player.initial_buyin || 0;
    const totalRebuys = player.total_rebuys || 0;
    return acc + initialBuyin + (totalRebuys * initialBuyin);
  }, 0);
};

export const calculateTotalResults = (players: GamePlayer[]) => {
  return players.reduce((acc, player) => {
    // Convert null to 0 for the calculation
    const finalResult = player.final_result === null ? 0 : player.final_result;
    return acc + finalResult;
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
    totals.buyIns += player.initial_buyin || 0;
    totals.rebuys += (player.total_rebuys || 0) * (player.initial_buyin || 0);
    totals.finalSum += player.final_result || 0;
    totals.finalResult += calculateFinalResult(player);
  });

  return totals;
};
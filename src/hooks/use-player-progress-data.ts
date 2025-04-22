
import { useState, useEffect } from "react";
import { format } from "date-fns";

type PlayerData = {
  player_name: string;
  games_data: {
    game_id: string;
    game_date: string;
    running_total: number;
  }[];
  games_count?: number;
};

// Chart colors array
export const CHART_COLORS = [
  "#3f51b5", "#f44336", "#4caf50", "#ff9800", "#9c27b0",
  "#009688", "#795548", "#607d8b", "#e91e63", "#2196f3",
];

export const usePlayerProgressData = (playersData: PlayerData[], selectedPlayers: string[]) => {
  const prepareChartData = () => {
    // Find all unique game dates across all players
    const allDates = new Set<string>();
    playersData.forEach(player => {
      player.games_data.forEach(game => {
        allDates.add(game.game_date);
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Create data points for each date
    const chartData = sortedDates.map(date => {
      const dataPoint: any = {
        date,
        formattedDate: format(new Date(date), "d MMM"),
      };

      selectedPlayers.forEach(playerName => {
        const player = playersData.find(p => p.player_name === playerName);
        if (player) {
          const playerFirstGame = player.games_data[0]?.game_date;
          const playerLastGame = player.games_data[player.games_data.length - 1]?.game_date;
          
          if (date >= playerFirstGame && date <= playerLastGame) {
            const gameOnThisDate = player.games_data.find(g => g.game_date === date);
            if (gameOnThisDate) {
              dataPoint[playerName] = gameOnThisDate.running_total;
            } else {
              const lastKnownGame = player.games_data
                .filter(g => g.game_date <= date)
                .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())[0];
              
              dataPoint[playerName] = lastKnownGame ? lastKnownGame.running_total : null;
            }
          }
        }
      });

      return dataPoint;
    });
    
    return chartData;
  };

  const getMinMaxValues = () => {
    let minValue = 0;
    let maxValue = 0;
    
    // Find global min and max across all selected players
    selectedPlayers.forEach(playerName => {
      const player = playersData.find(p => p.player_name === playerName);
      if (player && player.games_data.length > 0) {
        player.games_data.forEach(game => {
          minValue = Math.min(minValue, game.running_total);
          maxValue = Math.max(maxValue, game.running_total);
        });
      }
    });
    
    // Add padding (10%) to prevent values from touching the edges
    const padding = Math.max(Math.abs(maxValue - minValue) * 0.1, 10);
    return {
      min: Math.floor(minValue - padding),
      max: Math.ceil(maxValue + padding)
    };
  };

  const getPlayerColor = (playerName: string) => {
    const playerIndex = playersData.findIndex(p => p.player_name === playerName);
    return CHART_COLORS[playerIndex % CHART_COLORS.length];
  };

  return { prepareChartData, getMinMaxValues, getPlayerColor };
};

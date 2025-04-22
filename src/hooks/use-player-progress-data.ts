
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";

type PlayerData = {
  player_name: string;
  games_data: {
    game_id: string;
    game_date: string;
    running_total: number;
  }[];
  games_count?: number;
};

// Chart colors array - usando uma paleta mais vibrante
export const CHART_COLORS = [
  "#8B5CF6", // Vivid Purple
  "#D946EF", // Magenta Pink
  "#F97316", // Bright Orange
  "#0EA5E9", // Ocean Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#84CC16", // Lime
];

export const usePlayerProgressData = (playersData: PlayerData[], selectedPlayers: string[]) => {
  const prepareChartData = () => {
    // Identificar todas as datas de jogos
    const allDatesSet = new Set<string>();
    playersData.forEach(player => {
      player.games_data.forEach(game => {
        allDatesSet.add(game.game_date);
      });
    });

    // Ordenar as datas cronologicamente
    const allDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Dados pré-processados para cada jogador
    const playersProcessedData: Record<string, Record<string, number>> = {};
    
    // Para cada jogador selecionado, preencher valores para todas as datas
    selectedPlayers.forEach(playerName => {
      const player = playersData.find(p => p.player_name === playerName);
      if (!player) return;
      
      playersProcessedData[playerName] = {};
      
      // Ordenar jogos por data
      const sortedGames = [...player.games_data].sort(
        (a, b) => new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
      );
      
      // Preencher valores para todas as datas
      allDates.forEach((date, index) => {
        const gameOnDate = sortedGames.find(game => game.game_date === date);
        
        if (gameOnDate) {
          playersProcessedData[playerName][date] = gameOnDate.running_total;
        } else {
          // Encontrar o último jogo conhecido antes dessa data
          const lastKnownGame = sortedGames.find(game => 
            new Date(game.game_date).getTime() <= new Date(date).getTime()
          );
          
          if (lastKnownGame) {
            playersProcessedData[playerName][date] = lastKnownGame.running_total;
          } else {
            // Se não houver jogos anteriores, usar 0 ou null
            playersProcessedData[playerName][date] = 0;
          }
        }
      });
    });

    // Preparar dados para o gráfico horizontal
    return allDates.map(date => {
      const formattedDate = format(new Date(date), "d MMM");
      
      const dataPoint: Record<string, any> = {
        date,
        formattedDate,
      };
      
      selectedPlayers.forEach(playerName => {
        if (playersProcessedData[playerName] && playersProcessedData[playerName][date] !== undefined) {
          dataPoint[playerName] = playersProcessedData[playerName][date];
        }
      });
      
      return dataPoint;
    });
  };

  // Nova função para calcular o ranking em cada data
  const prepareRankingChartData = () => {
    const chartData = prepareChartData();
    const rankingData = chartData.map(dataPoint => {
      const { date, formattedDate } = dataPoint;
      
      // Extrair valores para cada jogador nesta data
      const playerValues: {name: string; value: number}[] = selectedPlayers
        .filter(playerName => dataPoint[playerName] !== undefined)
        .map(playerName => ({
          name: playerName,
          value: dataPoint[playerName]
        }))
        .sort((a, b) => b.value - a.value); // Ordenar por valor (maior primeiro)
      
      // Criar novo ponto de dados com posições
      const newDataPoint: Record<string, any> = {
        date,
        formattedDate,
      };
      
      // Atribuir posições
      playerValues.forEach((player, index) => {
        newDataPoint[`${player.name}_value`] = player.value;
        newDataPoint[`${player.name}_position`] = index + 1; // posição 1-indexed
      });
      
      return newDataPoint;
    });
    
    return rankingData;
  };

  const getMinMaxValues = () => {
    let minValue = 0;
    let maxValue = 0;
    
    // Encontrar min e max globais entre todos os jogadores selecionados
    selectedPlayers.forEach(playerName => {
      const player = playersData.find(p => p.player_name === playerName);
      if (player && player.games_data.length > 0) {
        player.games_data.forEach(game => {
          minValue = Math.min(minValue, game.running_total);
          maxValue = Math.max(maxValue, game.running_total);
        });
      }
    });
    
    // Adicionar padding (30%) para evitar que os valores toquem as bordas
    const range = Math.max(Math.abs(maxValue - minValue), 100);
    const padding = range * 0.3;
    
    // Garantir um padding mínimo
    const minPadding = 50;
    
    return {
      min: Math.floor(minValue - Math.max(padding, minPadding)),
      max: Math.ceil(maxValue + Math.max(padding, minPadding))
    };
  };

  const getPlayerColor = (playerName: string) => {
    const playerIndex = playersData.findIndex(p => p.player_name === playerName);
    return CHART_COLORS[playerIndex % CHART_COLORS.length];
  };

  return { 
    prepareChartData,
    prepareRankingChartData,
    getMinMaxValues, 
    getPlayerColor 
  };
};

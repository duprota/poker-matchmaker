
import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
import { useIsMobile } from "./use-mobile";

interface ChartDimensions {
  containerStyle: {
    width: string;
    height: string;
    aspectRatio?: string;
    minHeight?: string;
    position?: string;
  };
  margin: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
  chartConfig: {
    tickCount: number;
    fontSize: number;
    minTickGap?: number;
    xAxisInterval?: number | "preserveStart" | "preserveEnd" | "preserveStartEnd";
  };
}

export const useChartResponsive = () => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    containerStyle: {
      width: "100%",
      height: "100%",
      aspectRatio: isMobile ? "4/3" : "16/9",
      minHeight: isMobile ? "300px" : "400px",
      position: "relative",
    },
    margin: {
      top: 20,
      right: isMobile ? 20 : 30,
      left: isMobile ? 10 : 15,
      bottom: 30,
    },
    chartConfig: {
      tickCount: isMobile ? 4 : 8,
      fontSize: isMobile ? 10 : 12,
      minTickGap: isMobile ? 40 : 60,
      xAxisInterval: isMobile ? 1 : "preserveStartEnd"
    }
  });

  const updateDimensions = useCallback(() => {
    const width = containerRef.current?.clientWidth || 0;
    
    let rightMargin = 30;
    let leftMargin = 15;
    let bottomMargin = 30;
    let topMargin = 20;
    let fontSize = 12;
    let tickCount = 8;
    let minTickGap = 60;
    // Novo: intervalo dinâmico para o eixo X
    let xAxisInterval: number | "preserveStart" | "preserveEnd" | "preserveStartEnd" = "preserveStartEnd";
    
    // Ajustes baseados na largura do container
    if (width < 350) {
      rightMargin = 10;
      leftMargin = 5;
      bottomMargin = 20;
      fontSize = 8;
      tickCount = 2;
      minTickGap = 15;
      xAxisInterval = 2; // Mostrar apenas 1 a cada 3 ticks
    }
    else if (width < 400) {
      rightMargin = 15;
      leftMargin = 10;
      bottomMargin = 25;
      fontSize = 9;
      tickCount = 3;
      minTickGap = 20;
      xAxisInterval = 1; // Mostrar apenas 1 a cada 2 ticks
    } 
    else if (width < 600) {
      rightMargin = 20;
      leftMargin = 12;
      fontSize = 10;
      tickCount = 4;
      minTickGap = 30;
      xAxisInterval = "preserveStart"; // Preservar o primeiro e último
    } 
    else if (width < 900) {
      rightMargin = 25;
      leftMargin = 15;
      fontSize = 11;
      tickCount = 6;
      minTickGap = 40;
      xAxisInterval = "preserveStartEnd"; // Preservar o primeiro e último
    }
    
    const aspectRatio = width < 500 ? "4/3" : width < 800 ? "3/2" : "16/9";
    const minHeight = width < 500 ? "280px" : width < 800 ? "320px" : "400px";
    
    setDimensions({
      containerStyle: {
        width: "100%",
        height: "100%",
        aspectRatio,
        minHeight,
        position: "relative",
      },
      margin: {
        top: topMargin,
        right: rightMargin,
        left: leftMargin,
        bottom: bottomMargin,
      },
      chartConfig: {
        tickCount,
        fontSize,
        minTickGap,
        xAxisInterval
      }
    });
  }, []);

  useEffect(() => {
    const debouncedUpdate = debounce(updateDimensions, 250);
    
    if (containerRef.current && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        debouncedUpdate();
      });
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
        debouncedUpdate.cancel();
      };
    }
    
    window.addEventListener("resize", debouncedUpdate);
    updateDimensions();
    
    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      debouncedUpdate.cancel();
    };
  }, [updateDimensions]);

  return {
    containerRef,
    dimensions
  };
};

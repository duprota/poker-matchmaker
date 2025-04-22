
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
    
    if (width < 400) {
      rightMargin = 15;
      leftMargin = 10;
      bottomMargin = 25;
      fontSize = 9;
      tickCount = 3;
      minTickGap = 30;
    } else if (width < 600) {
      rightMargin = 20;
      leftMargin = 12;
      fontSize = 10;
      tickCount = 4;
      minTickGap = 40;
    } else if (width < 900) {
      rightMargin = 25;
      leftMargin = 15;
      fontSize = 11;
      tickCount = 6;
      minTickGap = 50;
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


import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { useIsMobile } from "./use-mobile";

interface ChartDimensions {
  containerStyle: {
    width: string;
    height: string;
    aspectRatio?: string;
    minHeight?: string;
  };
  margin: {
    top: number;
    right: number;
    left: number;
    bottom: number;
  };
}

export const useChartResponsive = () => {
  const isMobile = useIsMobile();
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    containerStyle: {
      width: "100%",
      height: "100%",
      aspectRatio: isMobile ? "4/3" : "16/9",
      minHeight: isMobile ? "300px" : "400px",
    },
    margin: {
      top: 10,
      right: isMobile ? 20 : 30,
      left: isMobile ? 5 : 10,
      bottom: 20,
    },
  });

  const updateDimensions = useCallback(() => {
    setDimensions({
      containerStyle: {
        width: "100%",
        height: "100%",
        aspectRatio: isMobile ? "4/3" : "16/9",
        minHeight: isMobile ? "300px" : "400px",
      },
      margin: {
        top: 10,
        right: isMobile ? 20 : 30,
        left: isMobile ? 5 : 10,
        bottom: 20,
      },
    });
  }, [isMobile]);

  useEffect(() => {
    const debouncedUpdate = debounce(updateDimensions, 250);
    window.addEventListener("resize", debouncedUpdate);
    updateDimensions();

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      debouncedUpdate.cancel();
    };
  }, [updateDimensions]);

  return dimensions;
};

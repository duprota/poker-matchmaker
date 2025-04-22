
import { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";

interface ChartDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  aspectRatio: number;
}

interface ChartDimensionsOptions {
  minWidth?: number;
  minHeight?: number;
  debounceTime?: number;
}

export const useChartDimensions = (options: ChartDimensionsOptions = {}) => {
  const {
    minWidth = 300,
    minHeight = 200,
    debounceTime = 250
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 0,
    height: 0,
    isLandscape: true,
    aspectRatio: 16/9
  });

  // Função que calcula e atualiza as dimensões
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    
    // Aplica dimensões mínimas para evitar problemas de renderização
    const width = Math.max(containerWidth, minWidth);
    const height = Math.max(containerHeight, minHeight);
    const isLandscape = width >= height;
    const aspectRatio = width / height;

    setDimensions({
      width,
      height,
      isLandscape,
      aspectRatio
    });
  }, [minWidth, minHeight]);

  // Aplica debounce para evitar múltiplas renderizações durante redimensionamento
  const debouncedUpdateDimensions = useCallback(
    debounce(updateDimensions, debounceTime),
    [updateDimensions, debounceTime]
  );

  useEffect(() => {
    // Executa uma medição inicial
    updateDimensions();

    // Configura o ResizeObserver para detectar mudanças de tamanho
    const observer = new ResizeObserver(() => {
      debouncedUpdateDimensions();
    });

    // Observa o elemento container
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Detecta mudanças de orientação do dispositivo
    const handleOrientationChange = () => {
      debouncedUpdateDimensions();
    };

    window.addEventListener('resize', handleOrientationChange);
    if (typeof window.orientation !== 'undefined') {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Limpeza
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleOrientationChange);
      if (typeof window.orientation !== 'undefined') {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
      debouncedUpdateDimensions.cancel();
    };
  }, [debouncedUpdateDimensions, updateDimensions]);

  // Retorna uma função auxiliar para calcular o número ideal de ticks com base na largura
  const getOptimalTickCount = useCallback((dataLength: number) => {
    if (!dimensions.width) return Math.min(5, dataLength);
    
    // Algoritmo para determinar número ideal de ticks baseado no espaço disponível
    // Assume que precisamos de pelo menos 50px por tick para legibilidade
    const maxTicks = Math.floor(dimensions.width / 50);
    return Math.min(maxTicks, dataLength, 10); // Limita a 10 ticks no máximo
  }, [dimensions.width]);

  return { 
    containerRef, 
    dimensions, 
    getOptimalTickCount 
  };
};

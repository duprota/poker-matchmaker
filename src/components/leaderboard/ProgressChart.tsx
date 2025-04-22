
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChartDimensions } from "@/hooks/use-chart-dimensions";

interface ProgressChartProps {
  chartData: any[];
  selectedPlayers: string[];
  chartConfig: Record<string, { label: string; color: string }>;
  domainLimits: { min: number; max: number };
}

export const ProgressChart = ({
  chartData,
  selectedPlayers,
  chartConfig,
  domainLimits
}: ProgressChartProps) => {
  const isMobile = useIsMobile();
  
  // Use o hook personalizado para obter as dimensões exatas e referência do container
  const { containerRef, dimensions, getOptimalTickCount } = useChartDimensions({
    minWidth: 300,
    minHeight: isMobile ? 350 : 500,
    debounceTime: 300
  });
  
  // Use provided domain limits
  const { min, max } = domainLimits || { min: 0, max: 0 };
  
  // Define margins dinamicamente com base nas dimensões disponíveis
  const margins = {
    top: 10,
    right: Math.max(5, Math.floor(dimensions.width * 0.02)), // Margem direita dinâmica
    bottom: Math.max(20, Math.floor(dimensions.height * 0.05)),
    left: isMobile ? 5 : Math.max(5, Math.floor(dimensions.width * 0.01)) // Reduz ao mínimo
  };
  
  // Ajusta o tamanho das fontes e elementos com base nas dimensões
  const fontSize = Math.max(
    isMobile ? 9 : 11,
    Math.min(12, Math.floor(dimensions.width / 80))
  );
  const strokeWidth = Math.min(2, Math.max(1, dimensions.width / 500));
  const dotRadius = Math.min(3, Math.max(2, dimensions.width / 600));
  const activeDotRadius = dotRadius * 2;

  // Número de ticks baseado no espaço disponível
  const xAxisTickCount = getOptimalTickCount(chartData.length);

  // Função para determinar o intervalo de ticks no eixo X
  const getXAxisInterval = () => {
    if (chartData.length <= xAxisTickCount) return 0; // Mostra todos
    return Math.ceil(chartData.length / xAxisTickCount) - 1;
  };

  // Função para customizar a formatação do eixo Y
  const formatYAxis = (value: number) => {
    if (isMobile || dimensions.width < 500) {
      // Em dispositivos móveis ou telas estreitas, mostrar formato mais compacto
      if (Math.abs(value) >= 1000) {
        return `$${Math.round(value/1000)}k`;
      }
      return `$${value}`;
    }
    return `$${value}`;
  };

  // Função para truncar ou formatar labels longos no eixo X
  const formatXAxisLabel = (value: string) => {
    if (dimensions.width < 400 && value.length > 5) {
      return value.substring(0, 5) + '...';
    }
    return value;
  };

  // Calcula a largura do eixo Y com base nas dimensões
  const yAxisWidth = Math.min(
    isMobile ? 30 : 50,
    Math.max(25, Math.floor(dimensions.width * 0.06))
  );

  return (
    <div 
      ref={containerRef}
      className="w-full h-full" 
      style={{ height: isMobile ? '400px' : '600px' }}
    >
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="99%">
          <LineChart 
            data={chartData} 
            margin={margins}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
            
            <XAxis 
              dataKey="formattedDate"
              tick={{ fontSize }}
              tickLine={{ stroke: '#888' }}
              axisLine={{ stroke: '#888' }}
              padding={{ left: 0, right: 0 }}
              tickMargin={5}
              interval={getXAxisInterval()}
              tickFormatter={formatXAxisLabel}
              scale="point"
            />
            
            <YAxis 
              type="number"
              domain={[min, max]}
              tickFormatter={formatYAxis}
              tick={{ fontSize }}
              width={yAxisWidth}
              tickLine={{ stroke: '#888' }}
              axisLine={{ stroke: '#888' }}
              allowDecimals={false}
              padding={{ top: 5, bottom: 5 }}
            />
            
            <Tooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
                labelFormatter={(date) => `Game: ${date}`}
              />}
              cursor={{ stroke: '#888', strokeWidth: 1, opacity: 0.3 }}
              wrapperStyle={{ zIndex: 100 }}
              isAnimationActive={false}
            />
            
            {/* Linha de referência em $0 */}
            <ReferenceLine 
              y={0} 
              stroke="#888" 
              strokeDasharray="3 3" 
              label={{ 
                value: "$0", 
                position: "insideLeft", 
                fontSize: fontSize - 1,
                fill: "#888" 
              }} 
            />
            
            {selectedPlayers.map((player, index) => (
              <Line
                key={`${player}-${index}`}
                type="monotone"
                dataKey={player}
                name={player}
                stroke={chartConfig[player].color}
                fill={chartConfig[player].color}
                strokeWidth={strokeWidth}
                connectNulls={true}
                dot={(props) => {
                  if (!props.payload || !props.payload.date) return null;
                  const hasGameOnThisDate = chartData.some(
                    d => d.date === props.payload.date && d[player] !== null && d[player] !== undefined
                  );
                  if (!hasGameOnThisDate) return null;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={dotRadius}
                      fill={chartConfig[player].color}
                      stroke="white"
                      strokeWidth={1}
                      key={`dot-${player}-${props.payload.date}-${index}`}
                    />
                  );
                }}
                activeDot={(props) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={activeDotRadius}
                    fill={chartConfig[player].color}
                    stroke="white"
                    strokeWidth={2}
                    key={`activeDot-${player}-${props.index}-${index}`}
                  />
                )}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

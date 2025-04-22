
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
  
  // Use provided domain limits
  const { min, max } = domainLimits || { min: 0, max: 0 };
  
  // Responsive chart dimensions
  const chartHeight = isMobile ? 400 : 600;
  
  // Ajustes de margem para reduzir espaço em branco e corrigir overflow
  const margins = {
    top: 10,
    right: isMobile ? 5 : 20,
    bottom: 20,
    left: isMobile ? 0 : 10
  };
  
  // Definições de estilo adaptadas para responsividade
  const fontSize = isMobile ? 9 : 11;
  const strokeWidth = 2;
  const dotRadius = isMobile ? 2 : 3;
  const activeDotRadius = isMobile ? 4 : 6;

  // Função para customizar a formatação do eixo Y
  const formatYAxis = (value: number) => {
    if (isMobile) {
      // Em dispositivos móveis, mostrar formato mais compacto
      if (Math.abs(value) >= 1000) {
        return `$${Math.round(value/1000)}k`;
      }
      return `$${value}`;
    }
    return `$${value}`;
  };

  // Função para determinar quantos ticks mostrar no eixo X baseado na largura
  const getXAxisTickCount = () => {
    if (isMobile) {
      return Math.min(3, chartData.length);
    }
    return Math.min(6, chartData.length);
  };

  return (
    <div className="w-full h-full" style={{ height: chartHeight }}>
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
              interval={isMobile ? Math.ceil(chartData.length / getXAxisTickCount()) - 1 : "preserveStartEnd"}
              scale="point"
            />
            
            <YAxis 
              type="number"
              domain={[min, max]}
              tickFormatter={formatYAxis}
              tick={{ fontSize }}
              width={isMobile ? 30 : 50}
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

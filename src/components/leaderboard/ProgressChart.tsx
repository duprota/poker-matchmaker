
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Dot,
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
  
  // Calculate chart dimensions and styling
  const chartHeight = isMobile ? 400 : 600;
  
  // Ajustes de margem para garantir espaço suficiente para todos os elementos
  const margins = {
    top: 20,
    right: isMobile ? 30 : 50,
    bottom: 20,
    left: isMobile ? 40 : 80
  };
  
  // Definições de estilo
  const fontSize = isMobile ? 10 : 12;
  const strokeWidth = 2;
  const dotRadius = isMobile ? 3 : 4;
  const activeDotRadius = isMobile ? 5 : 7;

  // Função para customizar a aparência do eixo
  const renderCustomAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="#888"
          fontSize={fontSize}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-full" style={{ height: chartHeight }}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="99%" height="99%">
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
              padding={{ left: 10, right: 10 }}
            />
            
            <YAxis 
              type="number"
              domain={[min, max]}
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize }}
              width={isMobile ? 60 : 80}
              tickLine={{ stroke: '#888' }}
              axisLine={{ stroke: '#888' }}
              padding={{ top: 10, bottom: 10 }}
              allowDecimals={false}
            />
            
            <Tooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
                labelFormatter={(date) => `Game: ${date}`}
              />}
              cursor={{ stroke: '#888', strokeWidth: 1, opacity: 0.3 }}
              wrapperStyle={{ zIndex: 100 }}
            />
            
            {/* Linha de referência em $0 */}
            <ReferenceLine 
              y={0} 
              stroke="#888" 
              strokeDasharray="3 3" 
              label={{ 
                value: "$0", 
                position: "left", 
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

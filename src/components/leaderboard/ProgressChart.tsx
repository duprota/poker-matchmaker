
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
  
  // Define margins adequadas para evitar overflow
  const margin = {
    top: 10,
    right: 30,
    left: isMobile ? 5 : 0,
    bottom: 20
  };
  
  // Use provided domain limits
  const { min, max } = domainLimits || { min: 0, max: 0 };
  
  // Ajusta o tamanho das fontes para melhor responsividade
  const fontSize = isMobile ? 10 : 12;
  const strokeWidth = 2;
  const dotRadius = 2;
  const activeDotRadius = 4;

  return (
    <div className="w-full h-[400px] md:h-[600px]">
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={margin}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
            
            <XAxis 
              dataKey="formattedDate"
              tick={{ fontSize }}
              tickLine={{ stroke: '#888' }}
              axisLine={{ stroke: '#888' }}
              padding={{ left: 0, right: 0 }}
              tickMargin={5}
              interval={isMobile ? 1 : 0}
              scale="point"
            />
            
            <YAxis 
              type="number"
              domain={[min, max]}
              tickFormatter={(value) => `$${isMobile ? Math.abs(value) >= 1000 ? `${Math.round(value/1000)}k` : value : value}`}
              tick={{ fontSize }}
              width={isMobile ? 40 : 60}
              tickLine={{ stroke: '#888' }}
              axisLine={{ stroke: '#888' }}
              allowDecimals={false}
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

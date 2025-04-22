
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  
  // Use provided domain limits or default to 0
  const { min, max } = domainLimits || { min: 0, max: 0 };
  
  // Calculate chart dimensions and styling
  const chartHeight = isMobile ? 350 : 550;
  const marginLeft = isMobile ? 35 : 70;
  const marginRight = isMobile ? 15 : 30; // Increased right margin to prevent overflow
  const marginTop = 5;
  const marginBottom = 5;
  const fontSize = isMobile ? 8 : 11;
  const dotRadius = isMobile ? 2 : 3;
  const activeDotRadius = isMobile ? 3 : 5;

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="99%" height="99%">
          <LineChart 
            data={chartData} 
            layout="vertical"
            margin={{ 
              top: marginTop,
              right: marginRight,
              left: marginLeft,
              bottom: marginBottom
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
            <YAxis 
              dataKey="formattedDate"
              type="category"
              tick={{ 
                fontSize: fontSize,
                textAnchor: 'end',
                width: isMobile ? 30 : 60,
              }}
              width={isMobile ? 30 : 60}
            />
            <XAxis 
              type="number"
              tick={{ 
                fontSize: fontSize,
                width: isMobile ? 20 : 40
              }}
              tickFormatter={(value) => `$${value}`}
              domain={[min, max]}
              allowDataOverflow={false}
              padding={{ left: 0, right: 10 }} // Add padding to prevent text truncation
              tickCount={isMobile ? 3 : 5} // Reduce tick count on mobile
            />
            <Tooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`$ ${Number(value).toFixed(2)}`, name]}
                labelFormatter={(date) => `Game: ${date}`}
              />}
              cursor={{ strokeWidth: 1 }}
              wrapperStyle={{ zIndex: 1000 }} // Ensure tooltip is visible
            />
            {selectedPlayers.map((player, index) => (
              <Line
                key={`${player}-${index}`}
                type="monotone"
                dataKey={player}
                name={player}
                stroke={chartConfig[player].color}
                strokeWidth={2}
                dot={(props) => {
                  if (!props.payload || !props.payload.date) return null;
                  const hasGameOnThisDate = chartData.some(
                    d => d.date === props.payload.date && d[player] !== null
                  );
                  if (!hasGameOnThisDate) return null;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={dotRadius}
                      fill={chartConfig[player].color}
                      stroke="none"
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
                    stroke="none"
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

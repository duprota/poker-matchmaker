
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
}

export const ProgressChart = ({
  chartData,
  selectedPlayers,
  chartConfig
}: ProgressChartProps) => {
  const isMobile = useIsMobile();

  // Find min and max values to set appropriate domain
  const getMinMax = () => {
    if (!chartData || chartData.length === 0) return { min: 0, max: 0 };
    
    let min = 0;
    let max = 0;
    
    chartData.forEach(dataPoint => {
      selectedPlayers.forEach(player => {
        if (dataPoint[player] !== undefined && dataPoint[player] !== null) {
          min = Math.min(min, dataPoint[player]);
          max = Math.max(max, dataPoint[player]);
        }
      });
    });
    
    // Add some padding to the domain
    min = Math.floor(min * 1.1);
    max = Math.ceil(max * 1.1);
    
    return { min, max };
  };
  
  const { min, max } = getMinMax();

  return (
    <div className="w-full" style={{ height: isMobile ? '400px' : '600px' }}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            layout="vertical"
            margin={{ 
              top: 5,
              right: isMobile ? 5 : 40,
              left: isMobile ? 45 : 80,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
            <YAxis 
              dataKey="formattedDate"
              type="category"
              tick={{ 
                fontSize: isMobile ? 8 : 11,
                textAnchor: 'end',
                width: isMobile ? 40 : 70,
              }}
              tickFormatter={(value) => value}
              width={isMobile ? 40 : 75}
            />
            <XAxis 
              type="number"
              tick={{ fontSize: isMobile ? 8 : 11 }}
              tickFormatter={(value) => `$${value}`}
              domain={[min, max]}
              allowDataOverflow={false}
              padding={{ left: 0, right: 0 }}
            />
            <Tooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`$ ${Number(value).toFixed(2)}`, name]}
                labelFormatter={(date) => `Game: ${date}`}
              />}
              cursor={{ strokeWidth: 1 }}
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
                      r={isMobile ? 2 : 3}
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
                    r={isMobile ? 3 : 5}
                    fill={chartConfig[player].color}
                    stroke="none"
                    key={`activeDot-${player}-${props.index}-${index}`}
                  />
                )}
                isAnimationActive={!isMobile}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

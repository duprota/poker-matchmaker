
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

  return (
    <div className="w-full" style={{ height: isMobile ? '400px' : '600px' }}>
      <ChartContainer config={chartConfig} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            layout="vertical"
            margin={{ 
              top: 5,
              right: isMobile ? 25 : 40,
              left: isMobile ? 60 : 80,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
            <YAxis 
              dataKey="formattedDate"
              type="category"
              tick={{ 
                fontSize: isMobile ? 9 : 11,
                textAnchor: 'end',
                width: isMobile ? 50 : 70,
              }}
              tickFormatter={(value) => value}
              width={isMobile ? 55 : 75}
            />
            <XAxis 
              type="number"
              tick={{ fontSize: isMobile ? 9 : 11 }}
              tickFormatter={(value) => `$${value}`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [`$ ${Number(value).toFixed(2)}`, name]}
                labelFormatter={(date) => `Game: ${date}`}
              />}
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
                    r={isMobile ? 4 : 5}
                    fill={chartConfig[player].color}
                    stroke="none"
                    key={`activeDot-${player}-${props.index}-${index}`}
                  />
                )}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

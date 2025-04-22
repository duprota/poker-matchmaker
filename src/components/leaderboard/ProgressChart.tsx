
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
import { useChartResponsive } from "@/hooks/use-chart-responsive";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  const { containerRef, dimensions } = useChartResponsive();
  const { containerStyle, margin, chartConfig: { fontSize, tickCount, minTickGap, xAxisInterval } } = dimensions;
  
  const { min, max } = domainLimits || { min: 0, max: 0 };
  const strokeWidth = 2;
  const dotRadius = 2;
  const activeDotRadius = 4;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full"
      style={{ 
        position: "relative",
        minHeight: containerStyle.minHeight
      }}
    >
      <AspectRatio 
        ratio={Number(containerStyle.aspectRatio?.split('/')[0]) / Number(containerStyle.aspectRatio?.split('/')[1])}
        className="w-full"
      >
        <ChartContainer config={chartConfig} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
              
              <XAxis 
                dataKey="formattedDate"
                tick={{ fontSize, fill: "#888" }}
                tickLine={{ stroke: '#888' }}
                axisLine={{ stroke: '#888' }}
                padding={{ left: 0, right: 0 }}
                tickMargin={5}
                interval={xAxisInterval}
                minTickGap={minTickGap}
                height={30}
                scale="point"
                allowDataOverflow={false}
                xAxisId={0}
              />
              
              <YAxis 
                type="number"
                domain={[min, max]}
                tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${Math.round(value/1000)}k` : value}`}
                tick={{ fontSize, fill: "#888" }}
                width={40}
                tickLine={{ stroke: '#888' }}
                axisLine={{ stroke: '#888' }}
                allowDecimals={false}
                tickCount={tickCount}
                yAxisId={0}
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
                yAxisId={0}
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
                  xAxisId={0}
                  yAxisId={0}
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
      </AspectRatio>
    </div>
  );
};

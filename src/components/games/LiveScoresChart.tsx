import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface LiveScoresChartProps {
  gameId: string;
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#06b6d4", "#f97316",
  "#84cc16", "#6366f1",
];

export const LiveScoresChart = ({ gameId }: LiveScoresChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSnapshots = async () => {
      const { data, error } = await supabase
        .from("live_game_scores")
        .select("player_id, total_rebuys_game, posicao_esperada, snapshot_at")
        .eq("game_id", gameId)
        .order("snapshot_at", { ascending: true });

      if (error || !data || data.length === 0) return;

      // Get player names
      const playerIds = [...new Set(data.map((d) => d.player_id))];
      const { data: players } = await supabase
        .from("players")
        .select("id, name")
        .in("id", playerIds);

      const nameMap: Record<string, string> = {};
      (players || []).forEach((p) => {
        nameMap[p.id] = p.name;
      });
      setPlayerNames(nameMap);

      // Group by snapshot_at
      const snapshotGroups = new Map<string, any>();
      data.forEach((row) => {
        const key = row.snapshot_at;
        if (!snapshotGroups.has(key)) {
          snapshotGroups.set(key, { rebuys: row.total_rebuys_game });
        }
        const group = snapshotGroups.get(key)!;
        // Invert position for chart (higher = better)
        group[row.player_id] = playerIds.length + 1 - row.posicao_esperada;
      });

      const chartArr = Array.from(snapshotGroups.entries()).map(([_, val]) => val);
      setChartData(chartArr);
    };

    fetchSnapshots();
  }, [gameId]);

  if (chartData.length <= 1) return null;

  const playerIds = Object.keys(playerNames);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-zinc-900/60 to-zinc-900/20 backdrop-blur-md">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          <h3 className="font-bold text-lg">Evolução das Probabilidades</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="rebuys"
              label={{ value: "Rebuys totais", position: "insideBottom", offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[1, playerIds.length]}
              ticks={Array.from({ length: playerIds.length }, (_, i) => i + 1)}
              tickFormatter={(val) => `${playerIds.length + 1 - val}º`}
              tick={{ fontSize: 12 }}
              label={{ value: "Posição", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: any, name: string) => [
                `${playerIds.length + 1 - value}º`,
                playerNames[name] || name,
              ]}
              labelFormatter={(label) => `Rebuy total: ${label}`}
            />
            <Legend
              formatter={(value) => playerNames[value] || value}
            />
            {playerIds.map((pid, i) => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={pid}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

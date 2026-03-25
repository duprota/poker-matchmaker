import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerGameEntry } from "@/hooks/usePlayerStats";

interface PlayerGameHistoryProps {
  games: PlayerGameEntry[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const PlayerGameHistory = ({ games }: PlayerGameHistoryProps) => {
  const navigate = useNavigate();

  if (games.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum jogo finalizado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Jogo</TableHead>
            <TableHead className="text-right">Buy-in</TableHead>
            <TableHead className="text-right">Rebuys</TableHead>
            <TableHead className="text-right">Resultado</TableHead>
            <TableHead className="text-right">Net</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((g) => (
            <TableRow
              key={g.game_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/games/${g.game_id}`)}
            >
              <TableCell className="text-xs">
                {new Date(g.game_date).toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-xs font-medium">
                {g.game_name || "—"}
              </TableCell>
              <TableCell className="text-right text-xs">
                {fmt(g.initial_buyin)}
              </TableCell>
              <TableCell className="text-right text-xs">
                {g.total_rebuys}
              </TableCell>
              <TableCell className="text-right text-xs">
                {fmt(g.final_result)}
              </TableCell>
              <TableCell
                className={`text-right text-xs font-semibold ${
                  g.net >= 0 ? "text-emerald-500" : "text-destructive"
                }`}
              >
                {fmt(g.net)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

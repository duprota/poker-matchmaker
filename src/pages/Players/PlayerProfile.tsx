import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvatarUploader } from "@/components/players/AvatarUploader";
import { PlayerKPICards } from "@/components/players/PlayerKPICards";
import { PlayerGameHistory } from "@/components/players/PlayerGameHistory";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Trash2, Key, Mail, TrendingUp, TrendingDown, Brain, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Player = Tables<"players">;

// ── Rating Card ──
const RatingCard = ({ playerId, mu, sigma, skillScore, ratingGames }: {
  playerId: string;
  mu: number | null;
  sigma: number | null;
  skillScore: number | null;
  ratingGames: number | null;
}) => {
  const games = ratingGames ?? 0;
  const isProvisional = games < 3;
  const rating = Math.round(skillScore ?? 0);

  if (games === 0) return null;

  return (
    <Card className="p-3 mt-3 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Skill Rating</span>
        {isProvisional && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-500">
            Provisório
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-4">
        <p className="text-2xl font-bold text-primary">{rating}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>μ {Number(mu ?? 25).toFixed(1)}</span>
          <span>σ {Number(sigma ?? 8.333).toFixed(1)}</span>
          <span>{games} {games === 1 ? "jogo" : "jogos"}</span>
        </div>
      </div>
    </Card>
  );
};

// ── ATP Card ──
const AtpCard = ({ playerId }: { playerId: string }) => {
  const { data: ranking } = useQuery({
    queryKey: ["atp-ranking-player", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atp_ranking" as any)
        .select("*");
      if (error) throw error;
      const all = (data || []) as any[];
      const idx = all.findIndex((p: any) => p.id === playerId);
      if (idx === -1) return null;
      return { ...all[idx], position: idx + 1 };
    },
  });

  if (!ranking) return null;

  return (
    <Card className="p-3 mt-3 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Ranking ATP</span>
        <span className="text-xs text-muted-foreground">#{ranking.position}</span>
      </div>
      <div className="flex items-baseline gap-4">
        <p className="text-2xl font-bold text-primary">{ranking.score_atp}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{ranking.games_scored} {ranking.games_scored === 1 ? "jogo" : "jogos"} na janela</span>
        </div>
      </div>
    </Card>
  );
};

// ── ATP History Chart ──
const AtpHistoryChart = ({ playerId }: { playerId: string | undefined }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["atp-history", playerId],
    enabled: !!playerId,
    queryFn: async () => {
      // Get all atp_points for this player with game dates
      const { data: points, error } = await supabase
        .from("atp_points")
        .select("raw_points, game_id, created_at")
        .eq("player_id", playerId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!points || points.length === 0) return [];

      // Get game dates
      const gameIds = points.map((p: any) => p.game_id);
      const { data: games } = await supabase
        .from("games")
        .select("id, date")
        .in("id", gameIds);

      const gameMap = new Map((games || []).map((g: any) => [g.id, g.date]));

      // Build cumulative chart data
      let cumulative = 0;
      return points.map((p: any) => {
        cumulative += Number(p.raw_points);
        const date = gameMap.get(p.game_id) || p.created_at;
        return {
          date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          score: Math.round(cumulative * 10) / 10,
          points: Math.round(Number(p.raw_points) * 10) / 10,
        };
      });
    },
  });

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Carregando...</p>;
  if (!history || history.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Sem histórico ATP ainda.</p>;
  }

  return (
    <Card className="p-4 mt-2">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value}`,
              name === "score" ? "Score Acumulado" : "Pontos no Jogo",
            ]}
            labelFormatter={(label) => `Jogo: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── Rating History Chart ──
const RatingHistoryChart = ({ playerId }: { playerId: string | undefined }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["rating-history", playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_rating_history")
        .select("skill_score_after, created_at, game_id, games!inner(date, name)")
        .eq("player_id", playerId!)
        .order("created_at", { ascending: true });

      if (error) {
        // Fallback: query without join if games relation fails
        const { data: fallback, error: fbErr } = await supabase
          .from("player_rating_history")
          .select("skill_score_after, created_at, game_id")
          .eq("player_id", playerId!)
          .order("created_at", { ascending: true });
        if (fbErr) throw fbErr;
        return (fallback || []).map((r: any) => ({
          date: new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          rating: Math.round(r.skill_score_after),
        }));
      }

      return (data || []).map((r: any) => ({
        date: new Date(r.games?.date || r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        rating: Math.round(r.skill_score_after),
      }));
    },
  });

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Carregando...</p>;
  if (!history || history.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Sem histórico de rating ainda.</p>;
  }

  return (
    <Card className="p-4 mt-2">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <Tooltip
            formatter={(value: number) => [`${value}`, "Rating"]}
            labelFormatter={(label) => `Jogo: ${label}`}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="rating"
            name="Skill Rating"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", pix_key: "" });
  const { data: stats, isLoading: statsLoading } = usePlayerStats(id);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast({ title: "Erro", description: "Jogador não encontrado", variant: "destructive" });
        navigate("/players");
        return;
      }
      setPlayer(data);
      setEditForm({ name: data.name, email: data.email || "", pix_key: data.pix_key || "" });
      setLoading(false);
    };
    fetch();
  }, [id]);

  const updatePlayer = async () => {
    if (!player || !editForm.name.trim()) return;
    const { error } = await supabase
      .from("players")
      .update({
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        pix_key: editForm.pix_key.trim() || null,
      })
      .eq("id", player.id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
      return;
    }
    setPlayer({ ...player, name: editForm.name.trim(), email: editForm.email.trim() || null, pix_key: editForm.pix_key.trim() || null });
    setEditOpen(false);
    toast({ title: "Sucesso", description: "Jogador atualizado" });
  };

  const deletePlayer = async () => {
    if (!player) return;
    const { error } = await supabase.from("players").delete().eq("id", player.id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
      return;
    }
    toast({ title: "Sucesso", description: "Jogador excluído" });
    navigate("/players");
  };

  const updateAvatar = async (url: string) => {
    if (!player) return;
    const { error } = await supabase.from("players").update({ avatar_url: url }).eq("id", player.id);
    if (error) throw error;
    setPlayer({ ...player, avatar_url: url });
  };

  if (loading || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-4 px-4 max-w-lg">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/players")} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-6">
          <AvatarUploader
            playerId={player.id}
            playerName={player.name}
            currentAvatar={player.avatar_url}
            onAvatarChange={updateAvatar}
            size="lg"
          />
          <h1 className="text-2xl font-bold text-foreground mt-3">{player.name}</h1>
          {player.email && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3" /> {player.email}
            </div>
          )}
          {player.pix_key && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Key className="h-3 w-3" /> {player.pix_key}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={deletePlayer}>
              <Trash2 className="h-3 w-3 mr-1" /> Excluir
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {stats && <PlayerKPICards stats={stats} />}

        {/* Rating Card */}
        {player && (
          <RatingCard playerId={player.id} mu={player.mu} sigma={player.sigma} skillScore={player.skill_score} ratingGames={player.rating_games} />
        )}

        {/* Extra stats row */}
        {stats && (
          <div className="flex justify-around mt-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-sm font-semibold text-foreground">{stats.winRate.toFixed(0)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Média/jogo</p>
              <p className={`text-sm font-semibold ${stats.avgNet >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                {stats.avgNet.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pior jogo</p>
              <p className="text-sm font-semibold text-destructive">
                {stats.worstGame.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="progress" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="progress" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-1" /> Progresso
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex-1">
              <Brain className="h-4 w-4 mr-1" /> Rating
            </TabsTrigger>
            <TabsTrigger value="games" className="flex-1">
              <TrendingDown className="h-4 w-4 mr-1" /> Jogos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            {stats && stats.progressData.length > 0 ? (
              <Card className="p-4 mt-2">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.progressData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <Tooltip
                      formatter={(value: number) =>
                        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      }
                      labelFormatter={(label) => `Jogo: ${label}`}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="runningTotal"
                      name="Saldo acumulado"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Sem dados de progresso ainda.
              </p>
            )}
          </TabsContent>

          <TabsContent value="rating">
            <RatingHistoryChart playerId={id} />
          </TabsContent>

          <TabsContent value="games">
            {stats && <PlayerGameHistory games={stats.gameHistory} />}
          </TabsContent>
        </Tabs>

        {/* Edit dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Jogador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <AvatarUploader
                  playerId={player.id}
                  playerName={player.name}
                  currentAvatar={player.avatar_url}
                  onAvatarChange={updateAvatar}
                  size="lg"
                />
              </div>
              <Input
                placeholder="Nome"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Email (opcional)"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                placeholder="Chave PIX (opcional)"
                value={editForm.pix_key}
                onChange={(e) => setEditForm((f) => ({ ...f, pix_key: e.target.value }))}
              />
              <Button onClick={updatePlayer} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PlayerProfile;

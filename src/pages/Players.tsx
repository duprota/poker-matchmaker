import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvatarUploader } from "@/components/players/AvatarUploader";

type Player = Tables<"players">;

interface PlayerMiniStats {
  games: number;
  net: number;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PlayerMiniStats>>({});
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPix, setNewPix] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
    fetchMiniStats();
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from("players").select("*").order("name");
    if (error) {
      toast({ title: "Erro", description: "Falha ao carregar jogadores", variant: "destructive" });
      return;
    }
    setPlayers(data || []);
  };

  const fetchMiniStats = async () => {
    const { data, error } = await supabase
      .from("game_players")
      .select("player_id, initial_buyin, total_rebuys, final_result, games!inner(status)")
      .eq("games.status", "completed")
      .not("final_result", "is", null);

    if (error) return;

    const map: Record<string, PlayerMiniStats> = {};
    (data || []).forEach((gp: any) => {
      const pid = gp.player_id;
      if (!map[pid]) map[pid] = { games: 0, net: 0 };
      map[pid].games += 1;
      const invested = gp.initial_buyin + gp.total_rebuys * gp.initial_buyin;
      map[pid].net += gp.final_result - invested;
    });
    setStatsMap(map);
  };

  const addPlayer = async () => {
    if (!newName.trim()) {
      toast({ title: "Erro", description: "Informe o nome", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("players")
      .insert([{ name: newName.trim(), email: newEmail.trim() || null, pix_key: newPix.trim() || null }])
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: "Falha ao adicionar", variant: "destructive" });
    } else {
      setPlayers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewEmail("");
      setNewPix("");
      setAddOpen(false);
      toast({ title: "Sucesso", description: "Jogador adicionado" });
    }
    setLoading(false);
  };

  const updatePlayerAvatar = async (playerId: string, url: string) => {
    const { error } = await supabase.from("players").update({ avatar_url: url }).eq("id", playerId);
    if (error) throw error;
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, avatar_url: url } : p)));
  };

  const filtered = useMemo(
    () =>
      players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [players, search]
  );

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-4 px-4 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Jogadores</h1>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Player list */}
        <div className="space-y-1">
          {filtered.map((player) => {
            const st = statsMap[player.id];
            const net = st?.net ?? 0;
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/players/${player.id}`)}
              >
                <AvatarUploader
                  playerId={player.id}
                  playerName={player.name}
                  currentAvatar={player.avatar_url}
                  onAvatarChange={(url) => updatePlayerAvatar(player.id, url)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {st ? `${st.games} jogos` : "0 jogos"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      net > 0
                        ? "text-emerald-500"
                        : net < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {fmt(net)}
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum jogador encontrado.
            </p>
          )}
        </div>

        {/* Add dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Jogador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input placeholder="Nome *" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Email (opcional)" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Input placeholder="Chave PIX (opcional)" value={newPix} onChange={(e) => setNewPix(e.target.value)} />
              <Button onClick={addPlayer} disabled={loading} className="w-full">
                {loading ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Players;

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const AtpConfigPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["atp-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atp_config")
        .select("id, window_size")
        .limit(1)
        .single();
      if (error) throw error;
      return data as any as { id: string; window_size: number };
    },
  });

  const [localWindow, setLocalWindow] = useState<number | null>(null);
  const windowSize = localWindow ?? config?.window_size ?? 15;

  const handleSave = async () => {
    if (!config?.id || windowSize < 1 || windowSize > 100) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("atp_config")
        .update({ window_size: windowSize, updated_at: new Date().toISOString() } as any)
        .eq("id", config.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["atp-ranking"] });
      queryClient.invalidateQueries({ queryKey: ["atp-config"] });
      queryClient.invalidateQueries({ queryKey: ["atp-dropping-points"] });
      setLocalWindow(null);

      toast({ title: "Salvo", description: `Janela atualizada para ${windowSize} jogos.` });
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar configuração.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4 mr-2" />
          Configuração do Ranking ATP
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="p-4 mt-2 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Janela de jogos considerados
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Apenas os últimos N jogos do grupo contam para o ranking (1–100).
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={100}
                value={windowSize}
                onChange={(e) => setLocalWindow(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">jogos</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Com esta configuração, apenas os pontos dos <strong>últimos {windowSize} jogos</strong> do grupo serão somados.
            Jogos com mais de {windowSize} partidas atrás são completamente descartados.
          </p>

          <Button
            onClick={handleSave}
            disabled={saving || windowSize === config?.window_size}
            size="sm"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

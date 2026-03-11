import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Settings, History, ChevronDown, Wifi, WifiOff, BookOpen } from "lucide-react";
import { format } from "date-fns";

const Bot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [guideOpen, setGuideOpen] = useState(false);

  // Fetch bot config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["bot-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch active session
  const { data: activeSession } = useQuery({
    queryKey: ["bot-active-session"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bot_sessions")
        .select("*")
        .eq("is_active", true)
        .order("last_activity_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    refetchInterval: 10000,
  });

  // Fetch message logs
  const { data: logs } = useQuery({
    queryKey: ["bot-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bot_message_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!config?.id) return;
      const { error } = await supabase
        .from("bot_config")
        .update(updates)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-config"] });
      toast({ title: "Configuração salva!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  // Close session mutation
  const closeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("bot_sessions")
        .update({ is_active: false })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-active-session"] });
      toast({ title: "Sessão encerrada" });
    },
  });

  // Send reminders mutation
  const sendReminders = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: { action: "send_reminders" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-logs"] });
      toast({ title: "Cobranças enviadas!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    },
  });

  const [formState, setFormState] = useState<Record<string, any>>({});

  const getFormValue = (key: string) => {
    return formState[key] !== undefined ? formState[key] : config?.[key as keyof typeof config] || "";
  };

  const handleSaveConfig = () => {
    const updates: Record<string, any> = {};
    if (formState.api_url !== undefined) updates.api_url = formState.api_url;
    if (formState.instance_name !== undefined) updates.instance_name = formState.instance_name;
    if (formState.group_id !== undefined) updates.group_id = formState.group_id;
    if (formState.bot_trigger !== undefined) updates.bot_trigger = formState.bot_trigger;
    if (formState.session_timeout_minutes !== undefined)
      updates.session_timeout_minutes = parseInt(formState.session_timeout_minutes) || 5;
    if (Object.keys(updates).length > 0) {
      updateConfig.mutate(updates);
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const directionBadge = (dir: string) => {
    switch (dir) {
      case "inbound": return <Badge variant="secondary">Entrada</Badge>;
      case "outbound": return <Badge className="bg-primary text-primary-foreground">Saída</Badge>;
      case "ignored": return <Badge variant="outline">Ignorada</Badge>;
      default: return <Badge variant="outline">{dir}</Badge>;
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Bot</h1>
        </div>

        {/* Config Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">Configuração</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="bot-enabled" className="text-sm text-muted-foreground">
                  {config?.enabled ? "Ativo" : "Inativo"}
                </Label>
                <Switch
                  id="bot-enabled"
                  checked={config?.enabled || false}
                  onCheckedChange={(checked) => updateConfig.mutate({ enabled: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">URL da API (Evolution)</Label>
                <Input
                  placeholder="https://sua-api.com"
                  value={getFormValue("api_url")}
                  onChange={(e) => setFormState((s) => ({ ...s, api_url: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nome da Instância</Label>
                <Input
                  placeholder="minha-instancia"
                  value={getFormValue("instance_name")}
                  onChange={(e) => setFormState((s) => ({ ...s, instance_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Group ID (JID)</Label>
                <Input
                  placeholder="123456789@g.us"
                  value={getFormValue("group_id")}
                  onChange={(e) => setFormState((s) => ({ ...s, group_id: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Trigger do Bot</Label>
                <Input
                  placeholder="@bot"
                  value={getFormValue("bot_trigger")}
                  onChange={(e) => setFormState((s) => ({ ...s, bot_trigger: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Timeout da Sessão (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={getFormValue("session_timeout_minutes")}
                  onChange={(e) => setFormState((s) => ({ ...s, session_timeout_minutes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSaveConfig} size="sm">
                Salvar Configuração
              </Button>
            </div>

            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Webhook URL (configure na Evolution API):</Label>
              <code className="block text-xs bg-muted p-2 rounded mt-1 break-all text-foreground">
                {webhookUrl}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Active Session & Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {activeSession ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
                <CardTitle className="text-lg">Sessão Ativa</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activeSession ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Iniciada por: <span className="text-foreground">{activeSession.started_by_phone}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Última atividade:{" "}
                    <span className="text-foreground">
                      {format(new Date(activeSession.last_activity_at), "HH:mm:ss")}
                    </span>
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => closeSession.mutate(activeSession.id)}
                  >
                    Encerrar Sessão
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sessão ativa no momento.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => sendReminders.mutate()}
                disabled={sendReminders.isPending}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendReminders.isPending ? "Enviando..." : "Enviar Cobranças"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Envia lembrete de pagamento no grupo com saldos pendentes e chaves Pix.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Message Logs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-lg">Log de Mensagens</CardTitle>
            </div>
            <CardDescription>Últimas 50 interações</CardDescription>
          </CardHeader>
          <CardContent>
            {logs && logs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direção</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead>Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{directionBadge(log.direction)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {log.message_text || "—"}
                        </TableCell>
                        <TableCell>
                          {log.parsed_intent ? (
                            <Badge variant="outline" className="text-xs">
                              {log.parsed_intent}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma mensagem registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-lg">Guia de Setup</CardTitle>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${guideOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="prose prose-sm max-w-none text-foreground">
                <h3 className="text-base font-semibold text-foreground">1. Evolution API (Docker)</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto text-foreground">
{`docker run -d \\
  --name evolution-api \\
  -p 8080:8080 \\
  -e AUTHENTICATION_API_KEY=sua-chave-aqui \\
  atendai/evolution-api:latest`}
                </pre>

                <h3 className="text-base font-semibold mt-4 text-foreground">2. Configurar Webhook na Evolution API</h3>
                <p className="text-muted-foreground">
                  Na interface da Evolution API, configure o webhook apontando para:
                </p>
                <code className="block bg-muted p-2 rounded text-xs break-all text-foreground">{webhookUrl}</code>
                <p className="text-muted-foreground">Eventos: <code className="text-foreground">MESSAGES_UPSERT</code></p>

                <h3 className="text-base font-semibold mt-4 text-foreground">3. Preencher Configuração</h3>
                <p className="text-muted-foreground">
                  Preencha os campos acima com a URL da sua API, nome da instância, e o Group ID do WhatsApp (formato: 123456789@g.us).
                </p>

                <h3 className="text-base font-semibold mt-4 text-foreground">4. Ativar o Bot</h3>
                <p className="text-muted-foreground">
                  Use o toggle &quot;Ativo&quot; acima para habilitar o bot. Ele só responderá quando alguém usar o trigger configurado (padrão: @bot).
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};

export default Bot;

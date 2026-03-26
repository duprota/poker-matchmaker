import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Target, TrendingUp, Clock, Award, Star, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { RankingComparisonTable } from "@/components/leaderboard/RankingComparisonTable";

const TIER_DATA = [
  {
    tier: "ATP 250",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconColor: "text-emerald-400",
    bgGlow: "from-emerald-500/5 to-transparent",
    description: "Mesas com média de skill mais baixa — jogos do dia a dia.",
    distribution: "~50% dos jogos",
    points: [250, 150, 100, 60, 30],
  },
  {
    tier: "ATP 500",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    iconColor: "text-blue-400",
    bgGlow: "from-blue-500/5 to-transparent",
    description: "Mesas intermediárias com competição acima da média.",
    distribution: "~35% dos jogos",
    points: [500, 300, 200, 120, 60],
  },
  {
    tier: "ATP 1000",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    iconColor: "text-purple-400",
    bgGlow: "from-purple-500/5 to-transparent",
    description: "As mesas mais disputadas — os melhores jogadores reunidos.",
    distribution: "~15% dos jogos",
    points: [1000, 600, 400, 240, 120],
  },
  {
    tier: "Grand Slam 🏆",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    iconColor: "text-amber-400",
    bgGlow: "from-amber-500/5 to-transparent",
    description: "Eventos especiais marcados manualmente pelo administrador.",
    distribution: "Seleção manual",
    points: [2000, 1200, 800, 480, 240],
  },
];

const POSITION_LABELS = ["1º", "2º", "3º", "4º", "5º"];

const AtpInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/leaderboard")}
            className="mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar ao Leaderboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ranking ATP</h1>
              <p className="text-sm text-muted-foreground">Como funciona o sistema de pontuação</p>
            </div>
          </div>
        </div>

        {/* Visão Geral */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Visão Geral
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Ranking ATP é um sistema de classificação permanente inspirado no tênis profissional. 
              Ele utiliza uma <strong className="text-foreground">janela deslizante</strong> que considera 
              apenas os pontos dos <strong className="text-foreground">últimos N jogos</strong> do grupo, 
              incentivando a participação constante e recompensando a consistência.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Cada jogo é classificado automaticamente em um <strong className="text-foreground">Tier</strong> (ATP 250, 500 ou 1000) 
              baseado na dificuldade da mesa. Apenas os <strong className="text-foreground">5 primeiros colocados</strong> de cada 
              mesa recebem pontos — do 6º em diante, a pontuação é zero.
            </p>
          </Card>
        </section>

        {/* Como os Tiers funcionam */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Sistema de Tiers
          </h2>
          <Card className="p-5 bg-card/80 border-border/50 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O tier de cada jogo é definido <strong className="text-foreground">automaticamente</strong> pela 
              média do <strong className="text-foreground">skill score</strong> dos participantes, comparada ao 
              histórico de todos os jogos completados:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">ATP 250:</strong> Média de skill abaixo do percentil 50 (metade inferior dos jogos)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">ATP 500:</strong> Média de skill entre os percentis 50 e 85</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">ATP 1000:</strong> Média de skill acima do percentil 85 (top 15% das mesas mais fortes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Grand Slam:</strong> Selecionado manualmente pelo administrador para eventos especiais</span>
              </li>
            </ul>
          </Card>

          {/* Tier cards with points */}
          <div className="space-y-3">
            {TIER_DATA.map((tier) => (
              <Card key={tier.tier} className={cn("p-4 bg-card/80 border-border/50 overflow-hidden relative")}>
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", tier.bgGlow)} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={cn("text-xs font-semibold", tier.color)}>
                      {tier.tier}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{tier.distribution}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{tier.description}</p>
                  <div className="flex gap-2">
                    {tier.points.map((pts, i) => (
                      <div key={i} className="flex-1 text-center py-2 rounded-md bg-muted/50 border border-border/30">
                        <div className="text-[10px] text-muted-foreground mb-0.5">{POSITION_LABELS[i]}</div>
                        <div className="text-sm font-bold text-foreground">{pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Janela Deslizante */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Janela Deslizante (Sliding Window)
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Apenas os pontos dos <strong className="text-foreground">últimos N jogos</strong> do grupo são contabilizados. 
              Quando um novo jogo é finalizado, o jogo mais antigo "sai" da janela e seus pontos deixam de contar.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Exemplo com janela de 15 jogos:</p>
              <p className="text-xs text-muted-foreground">
                Se o grupo jogou <strong className="text-foreground">50 jogos</strong>, apenas os jogos <strong className="text-foreground">#36 a #50</strong> contam 
                para o ranking. Quando o jogo #51 acontecer, o jogo #36 será descartado e os pontos dele removidos.
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Isso garante que <strong className="text-foreground">presença e consistência</strong> sejam recompensadas. 
              Jogadores que param de jogar veem seus pontos desaparecerem gradualmente.
            </p>
          </Card>
        </section>

        {/* Dropping Points */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Pontos em Risco (Dropping Points)
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No ranking, cada jogador pode ver um indicador <span className="text-orange-500 font-semibold">⚠ -XX</span> ao 
              lado da sua pontuação. Esses são os <strong className="text-foreground">pontos em risco</strong> — a quantidade 
              de pontos que o jogador perderá quando o próximo jogo do grupo for finalizado.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Esses pontos vêm do <strong className="text-foreground">jogo mais antigo dentro da janela</strong>. 
              Quando um novo jogo entrar na janela, esse jogo antigo será descartado.
            </p>
          </Card>
        </section>

        {/* Cálculo do Score */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Cálculo do Score
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/30 mb-3 font-mono text-sm text-foreground text-center">
              Score ATP = Σ pontos(jogo) <span className="text-muted-foreground text-xs ml-1">para cada jogo na janela</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Os pontos são <strong className="text-foreground">fixos por posição e tier</strong> — sem multiplicadores de ROI ou dificuldade</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>A posição é determinada pelo <strong className="text-foreground">resultado final</strong> (valor de saída) do jogador</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Apenas os <strong className="text-foreground">top 5</strong> pontuam — do 6º em diante, 0 pontos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>O tamanho da janela é configurável pelo administrador</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Skill Score */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            O que é o Skill Score?
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">Skill Score</strong> é uma métrica independente calculada pelo 
              sistema <strong className="text-foreground">Weng-Lin (TrueSkill)</strong> que mede a habilidade individual 
              de cada jogador com base no histórico completo de resultados.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Ele é usado exclusivamente para determinar o <strong className="text-foreground">tier do jogo</strong> — quanto 
              maior a média de skill dos participantes, mais difícil a mesa e maior o tier. O skill score em si não interfere 
              na pontuação ATP.
            </p>
          </Card>
        </section>

        {/* Resumo rápido */}
        <section className="mb-6">
          <Card className="p-5 bg-primary/5 border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Resumo Rápido
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>✅ Apenas os <strong className="text-foreground">últimos N jogos</strong> contam</li>
              <li>✅ Tier definido automaticamente pela <strong className="text-foreground">dificuldade da mesa</strong></li>
              <li>✅ Distribuição: <strong className="text-foreground">50% ATP 250</strong>, <strong className="text-foreground">35% ATP 500</strong>, <strong className="text-foreground">15% ATP 1000</strong></li>
              <li>✅ Apenas <strong className="text-foreground">top 5</strong> pontuam por jogo</li>
              <li>✅ Grand Slam é <strong className="text-foreground">manual</strong> para eventos especiais</li>
              <li>✅ Pontuação simples: <strong className="text-foreground">posição × tier = pontos</strong></li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AtpInfo;

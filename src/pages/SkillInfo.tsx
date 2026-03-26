import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, TrendingUp, BarChart3, Shield, HelpCircle, Sigma, Target, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RankingComparisonTable } from "@/components/leaderboard/RankingComparisonTable";

const SkillInfo = () => {
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
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Skill Rating</h1>
              <p className="text-sm text-muted-foreground">Como funciona o sistema de habilidade</p>
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
              O <strong className="text-foreground">Skill Rating</strong> é um sistema estatístico que estima a
              habilidade real de cada jogador com base no <strong className="text-foreground">histórico completo</strong> de
              resultados. Diferente do ATP, que pontua por posição, o Skill Rating analisa o desempenho relativo
              entre todos os participantes de cada mesa.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Ele é usado para duas finalidades: classificar jogadores por habilidade e
              determinar automaticamente o <strong className="text-foreground">tier dos jogos</strong> no ranking ATP
              (quanto maior a média de skill da mesa, maior o tier).
            </p>
          </Card>
        </section>

        {/* O Algoritmo */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            O Algoritmo: Weng-Lin (OpenSkill)
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilizamos o modelo <strong className="text-foreground">Weng-Lin</strong> com ordenação
              Plackett-Luce — uma evolução do TrueSkill da Microsoft. Ele foi projetado para jogos com
              múltiplos competidores (não apenas 1v1) e se adapta perfeitamente ao poker.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              A cada jogo finalizado, o algoritmo compara o resultado de cada jogador com o dos demais
              participantes e ajusta dois parâmetros:
            </p>
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">μ (mu)</Badge>
                  <span className="text-sm font-medium text-foreground">Habilidade Estimada</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Representa o nível de skill do jogador. Valor inicial: <strong className="text-foreground">25.0</strong>.
                  Quanto maior, melhor o jogador. Sobe ao vencer adversários fortes e desce ao perder para adversários mais fracos.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary">σ (sigma)</Badge>
                  <span className="text-sm font-medium text-foreground">Incerteza</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Indica o quão confiante o sistema está sobre o μ do jogador. Valor inicial: <strong className="text-foreground">8.333</strong>.
                  Diminui conforme o jogador acumula mais partidas. Jogadores novos têm σ alto — seus ratings oscilam mais.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Fórmula do Rating */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sigma className="w-5 h-5 text-primary" />
            Fórmula do Rating
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/30 mb-4 font-mono text-center">
              <div className="text-lg font-bold text-foreground">Rating = (μ − 3σ) × 40</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O rating exibido é uma <strong className="text-foreground">estimativa conservadora</strong> da habilidade.
              Ao subtrair 3 vezes o sigma, garantimos que o sistema mostra o{" "}
              <strong className="text-foreground">piso de confiança</strong> — o valor que o jogador tem{" "}
              <strong className="text-foreground">99.7% de chance</strong> de estar acima.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              O multiplicador <strong className="text-foreground">× 40</strong> apenas escala os valores para uma faixa mais
              legível (em vez de trabalhar com decimais pequenos).
            </p>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Exemplo prático:</p>
              <p className="text-xs text-muted-foreground">
                Jogador com <strong className="text-foreground">μ = 28.5</strong> e <strong className="text-foreground">σ = 2.1</strong>:
              </p>
              <p className="text-xs text-foreground font-mono mt-1">
                Rating = (28.5 − 3 × 2.1) × 40 = (28.5 − 6.3) × 40 = <strong>888</strong>
              </p>
            </div>
          </Card>
        </section>

        {/* Rating Provisório */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Rating Provisório
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Jogadores com <strong className="text-foreground">menos de 3 partidas</strong> recebem o badge{" "}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-yellow-500 mx-0.5">
                Provisório
              </Badge>{" "}
              ao lado do nome. Isso indica que o rating ainda possui{" "}
              <strong className="text-foreground">alta incerteza</strong> (σ elevado) e pode variar bastante nos próximos jogos.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Após 3 jogos, o sigma começa a se estabilizar e o rating passa a refletir melhor a habilidade real.
              Jogadores experientes (10+ jogos) têm ratings muito mais estáveis.
            </p>
          </Card>
        </section>

        {/* Como o rating evolui */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Como o Rating Evolui
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Vencer jogadores fortes</strong> sobe mais o μ do que vencer jogadores fracos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Perder para jogadores mais fracos</strong> derruba mais o μ do que perder para jogadores fortes
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  A cada jogo o <strong className="text-foreground">σ diminui</strong>, tornando o rating mais estável e confiável
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  O <strong className="text-foreground">histórico completo</strong> é considerado — não há janela deslizante como no ATP
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  O gráfico de evolução no <strong className="text-foreground">perfil do jogador</strong> mostra como o rating mudou jogo a jogo
                </span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Comparação dos Rankings */}
        <RankingComparisonTable />

        {/* Resumo */}
        <section className="mb-6">
          <Card className="p-5 bg-primary/5 border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Resumo Rápido
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>✅ Algoritmo <strong className="text-foreground">Weng-Lin (OpenSkill)</strong> — evolução do TrueSkill</li>
              <li>✅ Fórmula conservadora: <strong className="text-foreground">(μ − 3σ) × 40</strong></li>
              <li>✅ μ inicial = <strong className="text-foreground">25</strong>, σ inicial = <strong className="text-foreground">8.333</strong></li>
              <li>✅ Menos de 3 jogos = <strong className="text-foreground">Provisório</strong> (alta incerteza)</li>
              <li>✅ Considera <strong className="text-foreground">todos os jogos</strong>, não há janela</li>
              <li>✅ Usado para definir o <strong className="text-foreground">tier dos jogos ATP</strong></li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default SkillInfo;

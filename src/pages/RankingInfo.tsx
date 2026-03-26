import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Target, TrendingUp, DollarSign, Filter, Award, ListOrdered } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RankingComparisonTable } from "@/components/leaderboard/RankingComparisonTable";

const RankingInfo = () => {
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
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ranking Padrão</h1>
              <p className="text-sm text-muted-foreground">Como funciona o ranking financeiro</p>
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
              O <strong className="text-foreground">Ranking Padrão</strong> é o sistema de classificação mais 
              direto: ele ordena os jogadores pelo seu <strong className="text-foreground">resultado financeiro 
              real</strong> nas mesas de poker. É a resposta para a pergunta "quem mais lucrou?"
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Diferente do ATP (que pontua por posição) e do Skill Rating (que estima habilidade), o Ranking 
              Padrão reflete exatamente <strong className="text-foreground">quanto dinheiro</strong> cada jogador 
              ganhou ou perdeu.
            </p>
          </Card>
        </section>

        {/* Cálculo do Net Earnings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Cálculo do Resultado (Net Earnings)
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/30 mb-4 font-mono text-center">
              <div className="text-lg font-bold text-foreground">Net = Resultado Final − (Buy-in × (1 + Rebuys))</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para cada jogo, o sistema calcula o <strong className="text-foreground">lucro líquido</strong> do 
              jogador: quanto ele saiu da mesa menos o total investido (buy-in inicial multiplicado 
              por 1 + número de rebuys).
            </p>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Exemplo prático:</p>
              <p className="text-xs text-muted-foreground">
                Buy-in de <strong className="text-foreground">R$50</strong>, fez <strong className="text-foreground">2 rebuys</strong>, 
                saiu com <strong className="text-foreground">R$280</strong>:
              </p>
              <p className="text-xs text-foreground font-mono mt-1">
                Net = 280 − (50 × 3) = 280 − 150 = <strong className="text-green-500">+R$130</strong>
              </p>
            </div>
          </Card>
        </section>

        {/* Modos de Ordenação */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            Modos de Ordenação
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">📊 Total</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Soma de todos os net earnings. Mostra quem <strong className="text-foreground">mais lucrou (ou perdeu) 
                  no total</strong>. Favorece jogadores que jogam mais e mantêm resultados positivos.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">📈 Média</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Média de net earnings por jogo. Mostra quem tem o <strong className="text-foreground">melhor desempenho 
                  por sessão</strong>. Equilibra jogadores com poucos e muitos jogos.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Métricas Exibidas */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Métricas Exibidas
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Net Earnings:</strong> lucro/prejuízo total ou médio por jogo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">ROI (%):</strong> retorno sobre investimento — quanto % o jogador lucrou sobre o que gastou</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Games Played:</strong> total de jogos finalizados no período</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Total Spent:</strong> soma de todos os buy-ins e rebuys</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Biggest Win:</strong> maior lucro líquido em um único jogo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong className="text-foreground">Special Hands:</strong> contagem de mãos especiais (expandível ao clicar)</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Filtro por Ano */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtro por Período
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O ranking pode ser filtrado por <strong className="text-foreground">ano</strong> ou visualizado 
              no modo <strong className="text-foreground">All Time</strong> (todos os jogos desde o início). 
              O filtro afeta tanto o ranking quanto o gráfico de progresso.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Diferente do ATP (que usa janela deslizante) e do Skill (que sempre considera tudo), aqui o 
              filtro é <strong className="text-foreground">manual</strong> — você escolhe o período que deseja analisar.
            </p>
          </Card>
        </section>

        {/* Comparação */}
        <RankingComparisonTable />

        {/* Resumo */}
        <section className="mb-6">
          <Card className="p-5 bg-primary/5 border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Resumo Rápido
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>✅ Baseado em <strong className="text-foreground">resultados financeiros reais</strong></li>
              <li>✅ Fórmula: <strong className="text-foreground">Resultado − (Buy-in × (1 + Rebuys))</strong></li>
              <li>✅ 3 modos: <strong className="text-foreground">Total, Média e Special Hands</strong></li>
              <li>✅ Filtro por <strong className="text-foreground">ano</strong> ou <strong className="text-foreground">All Time</strong></li>
              <li>✅ <strong className="text-foreground">Todos os jogadores</strong> aparecem no ranking</li>
              <li>✅ Inclui métricas como <strong className="text-foreground">ROI, Biggest Win e Total Spent</strong></li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default RankingInfo;

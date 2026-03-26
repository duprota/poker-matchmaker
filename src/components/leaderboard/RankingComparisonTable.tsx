import { Card } from "@/components/ui/card";
import { GitCompareArrows } from "lucide-react";

const COMPARISON_ROWS = [
  { label: "O que mede", padrao: "Lucro/prejuízo financeiro", atp: "Desempenho posicional recente", skill: "Habilidade real estimada" },
  { label: "Base do cálculo", padrao: "Resultado − buy-in − rebuys", atp: "Posição no jogo × tier", skill: "Algoritmo Weng-Lin (μ, σ)" },
  { label: "Janela de tempo", padrao: "Filtro por ano ou All Time", atp: "Últimos N jogos (sliding window)", skill: "Histórico completo" },
  { label: "Pontuação", padrao: "Valor em R$ (net earnings)", atp: "Pontos fixos (250–2000)", skill: "Rating = (μ − 3σ) × 40" },
  { label: "Quem pontua", padrao: "Todos os jogadores", atp: "Apenas top 5 por jogo", skill: "Todos os jogadores" },
  { label: "Volatilidade", padrao: "Alta (depende de cada jogo)", atp: "Média (janela suaviza)", skill: "Baixa (estabiliza com o tempo)" },
  { label: "Ideal para", padrao: "Quem mais lucrou", atp: "Quem é mais consistente", skill: "Quem é o melhor jogador" },
];

export const RankingComparisonTable = () => {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <GitCompareArrows className="w-5 h-5 text-primary" />
        Comparação dos 3 Rankings
      </h2>
      <Card className="p-5 bg-card/80 border-border/50 overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground font-medium border-b border-border/30 pb-2">
            <div />
            <div className="text-center font-semibold text-foreground">📊 Padrão</div>
            <div className="text-center font-semibold text-foreground">🏆 ATP</div>
            <div className="text-center font-semibold text-foreground">🧠 Skill</div>
          </div>
          {COMPARISON_ROWS.map((row) => (
            <div key={row.label} className="grid grid-cols-4 gap-2 text-xs py-2.5 border-b border-border/10 last:border-0">
              <div className="font-medium text-foreground">{row.label}</div>
              <div className="text-center text-muted-foreground">{row.padrao}</div>
              <div className="text-center text-muted-foreground">{row.atp}</div>
              <div className="text-center text-muted-foreground">{row.skill}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

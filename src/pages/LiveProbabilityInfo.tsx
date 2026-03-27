import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Brain, Repeat, Clock, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LiveProbabilityInfo = () => {
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
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Probabilidades ao Vivo</h1>
              <p className="text-sm text-muted-foreground">Como o sistema prevê quem vai levar a noite</p>
            </div>
          </div>
        </div>

        {/* O que é */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            A Engine por Trás dos Números
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sabe quando você olha pra mesa e sente que alguém vai virar o jogo? O sistema de Probabilidades ao Vivo 
              faz a mesma coisa — só que com matemática. A cada rebuy registrado, uma engine de previsão recalcula as 
              chances de cada jogador vencer a noite. Não é achismo, não é feeling, não é o cara que "sempre ganha". 
              É um modelo calibrado com o <strong className="text-foreground">histórico real do grupo</strong> — 
              mais de 50 jogos e 346 participações alimentando cada número que aparece na tela.
            </p>
          </Card>
        </section>

        {/* Skill Score */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            O Skill Score — Antes da Primeira Carta
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Antes de qualquer carta ser virada, o sistema já tem uma opinião sobre cada jogador. Essa opinião é o 
              <strong className="text-foreground"> Skill Score</strong> — um rating calculado pelo algoritmo 
              <strong className="text-foreground"> Weng-Lin</strong>, o mesmo utilizado em plataformas de xadrez online 
              e jogos competitivos para medir habilidade real, separando sorte de consistência.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Funciona assim: cada jogador começa com um rating padrão. A cada jogo finalizado, o rating sobe ou 
              desce conforme a posição final — e o detalhe que importa é que <strong className="text-foreground">vencer 
              uma mesa de jogadores fortes vale mais do que vencer uma mesa fraca</strong>. O sistema detecta a força 
              dos adversários automaticamente. Quem jogou pouco ainda tem um rating "provisório" — o modelo está 
              aprendendo. Quem jogou muito tem um rating sólido, difícil de mover com um único resultado fora da curva.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Na prática, quando a partida começa, a probabilidade inicial de cada jogador é proporcional ao seu 
              Skill Score relativo à mesa. Se Vinicius tem skill maior que a média dos presentes, ele abre como 
              favorito. Simples assim.
            </p>
          </Card>
        </section>

        {/* Rebuys — Três Camadas */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-yellow-400" />
            Quando o Rebuy Acontece — Três Camadas de Cálculo
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              É no rebuy que o jogo dentro do jogo começa. Quando alguém rebuy, o sistema não simplesmente "diminui 
              a chance" — ele recalcula tudo combinando três fatores simultâneos, como um comentarista que lê a 
              jogada considerando o placar, o histórico e o momento do campeonato ao mesmo tempo.
            </p>

            <div className="mt-4 p-4 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Camada 1</Badge>
                O peso do momento
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema reconhece três fases da partida — <strong className="text-foreground">Abertura 🟢</strong>, 
                <strong className="text-foreground"> Meio 🟡</strong> e <strong className="text-foreground"> Reta Final 🔴</strong> — 
                baseadas no total de rebuys já acontecidos na mesa. Um rebuy na Abertura, quando o pot ainda é pequeno, 
                representa uma fatia grande do jogo e pesa mais na probabilidade. O mesmo rebuy na Reta Final, quando 
                o pot já está enorme, compra uma fatia menor e pesa menos. Contexto importa.
              </p>
            </div>

            <div className="mt-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Camada 2</Badge>
                Rebuys acumulados
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O primeiro rebuy reduz a probabilidade em cerca de 50%. O segundo reduz mais. A partir do terceiro e 
                quarto rebuy, a queda é drástica — os dados históricos do grupo mostram que a taxa de recuperação cai 
                para <strong className="text-foreground">menos de 10%</strong> nessa situação. Esses multiplicadores 
                não são estimativas genéricas: foram calibrados com os jogos reais do Poker Night.
              </p>
            </div>

            <div className="mt-3 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">Camada 3</Badge>
                O DNA do jogador
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aqui é onde fica interessante. O sistema sabe que cada jogador se comporta diferente quando faz rebuy. 
                Para cada um, calculamos o quanto ele performa <strong className="text-foreground">acima ou abaixo</strong> do 
                que o skill previa, separado por faixa de rebuy. São os chamados <em>deltas pessoais</em>.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">+10%</Badge>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">B9</strong> com 5+ rebuys performa acima do esperado — 
                    literalmente fica mais perigoso quando está sofrendo
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">−10%</Badge>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Rodrigo Alemão</strong> a partir do 3º rebuy — 
                    0 vitórias em 15 tentativas nessa faixa
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">+20%</Badge>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Rodolfo</strong> sem rebuy — o jogador mais difícil de parar 
                    quando não precisa voltar pro jogo
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Esses deltas são atualizados automaticamente ao final de cada jogo, incorporando os novos dados ao modelo.
              </p>
            </div>
          </Card>
        </section>

        {/* Convergência */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            A Convergência — De Chute Educado a Previsão Afiada
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No início da partida, a previsão é uma estimativa educada — baseada no que o sistema sabe sobre cada 
              jogador antes de qualquer ação. Conforme os rebuys se acumulam e as fases avançam, o modelo vai absorvendo 
              evidências reais <em>daquela partida específica</em>. É como um comentarista que no primeiro tempo fala 
              sobre as escalações, mas no segundo tempo já está falando sobre o que viu em campo.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Na <strong className="text-foreground">Reta Final 🔴</strong>, o ranking previsto tende a estar muito 
              próximo do resultado real. Quando o jogo acaba, você pode ver no gráfico de convergência como as 
              probabilidades foram se ajustando ao longo da noite — e comparar com o que realmente aconteceu.
            </p>
          </Card>
        </section>

        {/* O que o sistema não vê */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-400" />
            O que o Sistema Não Vê
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              As cartas. O sistema não tem acesso às mãos — trabalha apenas com o que acontece na mesa de forma 
              observável: quem fez rebuy, quando fez, e o que o histórico de cada jogador diz sobre aquela situação. 
              Por isso ele pode errar, especialmente quando um azarão simplesmente está com as melhores cartas da noite. 
              É uma ferramenta para <strong className="text-foreground">animar a conversa e enriquecer a experiência</strong> — 
              não um oráculo. Se fosse infalível, não teria graça.
            </p>
          </Card>
        </section>

        {/* Fica melhor com o tempo */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            Fica Melhor com o Tempo
          </h2>
          <Card className="p-5 bg-card/80 border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cada jogo finalizado recalibra o modelo. Os deltas pessoais são atualizados, o Skill Score de cada 
              jogador evolui, e as previsões ficam mais afiadas. O sistema aprende com o <em>nosso</em> grupo — 
              não com jogadores genéricos da internet. Quanto mais a gente joga, mais ele acerta.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Na próxima partida, preste atenção no painel. Observe como as probabilidades reagem ao primeiro rebuy 
              pesado, como o favorito muda na Reta Final, como aquele jogador que "sempre volta" é tratado diferente 
              pelo sistema. Os números estão contando uma história — a história do jogo, em tempo real.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LiveProbabilityInfo;

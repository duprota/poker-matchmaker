

# Skill Rating System (Weng-Lin / OpenSkill) — Plano de Implementação

## Resumo

Implementar um sistema de rating baseado no algoritmo Weng-Lin (Plackett-Luce) que calcula μ (habilidade estimada) e σ (incerteza) para cada jogador, gerando um `skill_score = (μ - 3σ) × 40`. O rating é recalculado automaticamente quando um jogo é finalizado e revertido se o jogo for reaberto.

## 1. Migration Supabase

### 1a. Adicionar colunas em `players`
```sql
ALTER TABLE players
  ADD COLUMN mu NUMERIC DEFAULT 25,
  ADD COLUMN sigma NUMERIC DEFAULT 8.333,
  ADD COLUMN skill_score NUMERIC DEFAULT 0,
  ADD COLUMN rating_games INTEGER DEFAULT 0;
```

### 1b. Criar tabela `player_rating_history`
```sql
CREATE TABLE player_rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mu_before NUMERIC NOT NULL,
  sigma_before NUMERIC NOT NULL,
  mu_after NUMERIC NOT NULL,
  sigma_after NUMERIC NOT NULL,
  skill_score_after NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, game_id)
);

ALTER TABLE player_rating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view rating history"
  ON player_rating_history FOR SELECT TO public USING (true);

CREATE POLICY "Everyone can insert rating history"
  ON player_rating_history FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Everyone can delete rating history"
  ON player_rating_history FOR DELETE TO public USING (true);
```

**Nota:** `game_players` não tem coluna `position`. A posição será derivada do `final_result` (ordenado decrescente) no momento do cálculo — quem terminou com mais fichas = posição 1.

## 2. Edge Function: `calculate-ratings`

Uma Edge Function Deno que implementa o algoritmo Weng-Lin internamente (sem dependência externa, ~80 linhas de math puro — distribuição normal, update de μ/σ via Plackett-Luce simplificado).

**Trigger:** Chamada pelo frontend após finalizar ou reabrir um jogo.

**Fluxo — Jogo Finalizado (`completed`):**
1. Buscar todos `game_players` do jogo com `final_result`
2. Buscar `mu` e `sigma` atuais de cada jogador em `players`
3. Ordenar por `final_result` DESC para derivar rankings (posição 1 = maior resultado)
4. Aplicar algoritmo Weng-Lin (Plackett-Luce) para calcular novos μ e σ
5. `skill_score = (μ_new - 3 * σ_new) * 40`
6. Inserir snapshots em `player_rating_history`
7. Atualizar `players.mu`, `players.sigma`, `players.skill_score`, incrementar `rating_games`

**Fluxo — Jogo Reaberto (reverter):**
1. Buscar snapshots de `player_rating_history` para o `game_id`
2. Restaurar `mu_before` e `sigma_before` em `players`
3. Recalcular `skill_score` com valores restaurados
4. Deletar os snapshots do jogo
5. Decrementar `rating_games`

## 3. Integração no Frontend — Trigger Automático

### `FinalizeGameForm.tsx`
Após finalizar o jogo com sucesso (status = completed), chamar `supabase.functions.invoke('calculate-ratings', { body: { game_id, action: 'calculate' } })`.

### `GameActions.tsx` (ou onde reabre jogos)
Ao reabrir jogo, chamar `supabase.functions.invoke('calculate-ratings', { body: { game_id, action: 'revert' } })` antes de mudar o status.

## 4. Novo Tab "Skill Rating" no Leaderboard

### `src/pages/Leaderboard.tsx`
- Adicionar terceira tab "Skill Rating" nas Tabs existentes (Rankings | Progress | Skill Rating)
- Nova query que busca `players` com `rating_games >= 1`, ordenados por `skill_score DESC, rating_games DESC`

### `src/components/leaderboard/SkillRatingTable.tsx` (novo)
- Tabela com colunas: Posição | Avatar+Nome | Rating (skill_score formatado) | μ | Jogos
- Badge "Provisório" para jogadores com `rating_games < 3` (cor amarela, texto menor)
- Cards estilo mobile com layout similar ao LeaderboardCard existente

## 5. Atualizar Perfil do Jogador

### `src/pages/Players/PlayerProfile.tsx`
- Adicionar card de Rating acima das tabs existentes (ao lado dos KPIs)
- Mostrar: skill_score atual, μ, σ, rating_games
- Badge "Provisório" se < 3 jogos

### Nova tab "Rating" nas tabs do perfil
- Gráfico de linha (Recharts) com evolução do `skill_score_after` ao longo do tempo
- Fonte: `player_rating_history` ordenado por `created_at`
- Mesma estrutura visual do gráfico de progresso existente

### `src/hooks/usePlayerStats.ts`
- Adicionar query para `player_rating_history` do jogador para alimentar o gráfico

## 6. Inicialização dos Ratings Históricos

Após a migration, criar um script (via Edge Function `calculate-ratings` com action `recalculate-all`) que:
1. Busca todos os jogos `completed` ordenados por `date ASC`
2. Para cada jogo, simula o cálculo de rating na ordem cronológica
3. Popula `player_rating_history` e atualiza `players` com os ratings finais

Isso garante que os 50 jogos existentes gerem dados históricos reais.

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar colunas em players + tabela player_rating_history |
| `supabase/functions/calculate-ratings/index.ts` | Criar — Edge Function com Weng-Lin |
| `src/components/games/FinalizeGameForm.tsx` | Chamar Edge Function após finalizar |
| `src/components/games/GameActions.tsx` | Chamar Edge Function ao reabrir |
| `src/pages/Leaderboard.tsx` | Adicionar tab Skill Rating |
| `src/components/leaderboard/SkillRatingTable.tsx` | Criar — tabela de skill rating |
| `src/pages/Players/PlayerProfile.tsx` | Card de rating + tab com gráfico |
| `src/hooks/usePlayerStats.ts` | Adicionar dados de rating history |

## Detalhes Técnicos — Weng-Lin (Plackett-Luce)

Implementação interna na Edge Function (~80 linhas), sem npm. Fórmulas core:
- **φ(x)**: PDF da normal padrão
- **Φ(x)**: CDF da normal padrão
- Para cada par (i vence j): calcular c = √(2β² + σᵢ² + σⱼ²), delta e update
- β = σ_default / 2 = 4.1665
- κ (fator de dinâmica) = 0.0001

O skill_score conservador `(μ - 3σ) × 40` penaliza incerteza alta, garantindo que jogadores com poucos jogos não dominem o ranking mesmo com μ alto.


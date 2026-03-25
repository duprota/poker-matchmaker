

# Fase 2 — Ranking ATP com Janela Fixa (Sliding Window)

## Resumo

Ranking permanente onde apenas os pontos dos **últimos N jogos do grupo** são considerados. Jogos anteriores são completamente descartados. N é configurável pelo admin. Isso substitui o decay multiplicativo por uma janela fixa simples.

## Mecânica Simplificada

```text
Score_ATP(jogador) = Σ raw_points(jogo_k)
                     onde jogo_k está entre os últimos N jogos do grupo
```

- Se o grupo jogou 50 jogos e N=15, apenas os jogos #36 a #50 contam
- Um jogador que não participou de nenhum dos últimos 15 jogos tem Score = 0 e não aparece no ranking
- Quando um novo jogo acontece, o jogo #36 sai da janela automaticamente — os pontos daquele jogo são perdidos
- Isso permite ao jogador ver exatamente quais pontos cairão no próximo jogo

## 1. Migration Supabase

### Tabela `atp_points`
Armazena pontos brutos por jogador/jogo:
- `id UUID PK`, `player_id` (FK players), `game_id` (FK games)
- `raw_points NUMERIC`, `base_points NUMERIC`, `sos_multiplier NUMERIC`, `roi_factor NUMERIC`
- `position INTEGER`, `roi NUMERIC`, `created_at TIMESTAMPTZ`
- UNIQUE(player_id, game_id)
- RLS: leitura pública, insert/delete público

### Tabela `atp_config`
Configuração global (1 linha):
- `id UUID PK`, `window_size INTEGER NOT NULL DEFAULT 15` (CHECK >= 1 AND <= 100), `updated_at TIMESTAMPTZ`
- Inserir linha inicial com window_size = 15
- RLS: leitura pública, update para authenticated

### View `atp_ranking`
```sql
WITH recent_games AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY date DESC) AS rn
  FROM games WHERE status = 'completed'
),
config AS (SELECT window_size FROM atp_config LIMIT 1)
SELECT p.id, p.name, p.avatar_url,
  ROUND(SUM(ap.raw_points)::numeric, 1) AS score_atp,
  COUNT(ap.id) AS games_scored
FROM players p
JOIN atp_points ap ON ap.player_id = p.id
JOIN recent_games rg ON rg.id = ap.game_id
CROSS JOIN config c
WHERE rg.rn <= c.window_size
GROUP BY p.id, p.name, p.avatar_url
ORDER BY score_atp DESC;
```

## 2. Edge Function: Expandir `calculate-ratings`

Adicionar ações na Edge Function existente:

### `calculate-atp`
Para cada participante do jogo finalizado:
1. Derivar posição do `final_result` (DESC)
2. `ROI = (final_result - initial_buyin*(1+total_rebuys)) / initial_buyin * 100`
3. `base_points`: 1º=100, 2º=60, 3º=40, demais=max(0, 10*(n-pos))
4. `SoS = MAX(0.5, AVG(skill_score dos outros jogadores) / 100)`
5. `f(ROI)`: ROI>=0 → `ln(e + ROI/100)`, ROI<0 → `1/(1+0.5*|ROI/100|)`
6. `raw_points = base_points * SoS * f(ROI)`
7. Inserir em `atp_points`

### `revert-atp`
Deleta registros de `atp_points` para o game_id.

### `recalculate-all-atp`
Processa todos os jogos completed em ordem cronológica para popular dados históricos.

## 3. Frontend — Trigger

### `FinalizeGameForm.tsx`
Após chamar `calculate` (skill rating), chamar `calculate-atp` na mesma Edge Function.

## 4. Nova Tab "Ranking ATP" no Leaderboard

### `src/pages/Leaderboard.tsx`
- 4ª tab: Rankings | Progresso | Skill Rating | **Ranking ATP**

### `src/components/leaderboard/AtpRankingTable.tsx` (novo)
- Query na view `atp_ranking`
- Colunas: Posição | Avatar+Nome | Score ATP | Jogos (na janela)
- Info banner: "Considerando os últimos {N} jogos do grupo. Jogos anteriores não contam."
- Para cada jogador: mostrar quais pontos cairão quando o próximo jogo acontecer (pontos do jogo mais antigo na janela daquele jogador)
- Jogadores sem jogos na janela não aparecem

### `src/components/leaderboard/AtpConfigPanel.tsx` (novo)
- Input numérico para `window_size` (1–100)
- Preview: "Janela atual: últimos {N} jogos. Jogos com mais de {N} partidas atrás são descartados."
- Botão salvar → UPDATE em `atp_config`

## 5. Perfil do Jogador

### `src/pages/Players/PlayerProfile.tsx`
- Card "ATP Score" com: Score ATP atual, posição no ranking, pontos que cairão no próximo jogo
- Tab "ATP" com gráfico de evolução: eixo X = jogos do grupo, eixo Y = Score ATP acumulado na janela naquele momento

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar `atp_points`, `atp_config`, view `atp_ranking` |
| `supabase/functions/calculate-ratings/index.ts` | Adicionar `calculate-atp`, `revert-atp`, `recalculate-all-atp` |
| `src/components/games/FinalizeGameForm.tsx` | Chamar `calculate-atp` após finalizar |
| `src/pages/Leaderboard.tsx` | Adicionar 4ª tab |
| `src/components/leaderboard/AtpRankingTable.tsx` | Criar |
| `src/components/leaderboard/AtpConfigPanel.tsx` | Criar |
| `src/pages/Players/PlayerProfile.tsx` | Card ATP + tab gráfico |
| `src/integrations/supabase/types.ts` | Atualizado pela migration |

## Vantagens da Janela Fixa vs Decay Multiplicativo

- **Transparência**: jogador sabe exatamente quais pontos perderá
- **Simplicidade**: sem fórmulas exponenciais, fácil de explicar
- **Penaliza ausência**: jogador que para de jogar sai do ranking quando seus jogos saem da janela
- **Configurável**: admin ajusta N para mais ou menos memória


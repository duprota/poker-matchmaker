

# Fase 2 — Ranking ATP com Tiers e Janela Fixa (Sliding Window)

## Resumo

Ranking permanente onde apenas os pontos dos **últimos N jogos do grupo** são considerados. A pontuação de cada jogo é determinada por **Tiers** (ATP 250, 500, 1000, Grand Slam), classificados automaticamente pela dificuldade da mesa (média do skill_score) ou manualmente (Grand Slam). Apenas os **5 primeiros colocados** pontuam.

## Mecânica dos Tiers

### Classificação automática por percentis

Os tiers 250/500/1000 são definidos pela média do `skill_score` dos participantes, comparada ao histórico de todos os jogos completados:

| Tier | Critério | Pontos: 1º / 2º / 3º / 4º / 5º |
|------|----------|----------------------------------|
| **ATP 250** | Média skill ≤ Percentil 33 | 250 / 150 / 100 / 60 / 30 |
| **ATP 500** | Média skill entre P33 e P66 | 500 / 300 / 200 / 120 / 60 |
| **ATP 1000** | Média skill > Percentil 66 | 1000 / 600 / 400 / 240 / 120 |
| **Grand Slam** 🏆 | Seleção manual (flag `is_grand_slam` no jogo) | 2000 / 1200 / 800 / 480 / 240 |

- **6º colocado em diante = 0 pontos**
- Percentis são recalculados a cada jogo com base no histórico completo
- Grand Slam é marcado pelo admin na criação/edição do jogo

### Score ATP

```text
Score_ATP(jogador) = Σ raw_points(jogo_k)
                     onde jogo_k está entre os últimos N jogos do grupo
```

- raw_points = pontos fixos do tier pela posição (sem multiplicadores de ROI ou SoS)
- Se o grupo jogou 50 jogos e N=15, apenas os jogos #36 a #50 contam

## 1. Migration Supabase

### Alterar tabela `atp_points`
- Adicionar coluna `tier TEXT` (valores: '250', '500', '1000', 'grand_slam')
- Manter colunas existentes para compatibilidade

### Alterar tabela `games`
- Adicionar coluna `is_grand_slam BOOLEAN DEFAULT false`

### Tabela `atp_config` (já existe)
- `window_size INTEGER NOT NULL DEFAULT 15`

### View `atp_ranking` (já existe, manter)

## 2. Edge Function: `calculate-ratings`

### `calculate-atp`
Para cada participante do jogo finalizado:
1. Calcular média skill_score dos participantes
2. Buscar percentis P33/P66 do histórico de jogos
3. Classificar tier (ou Grand Slam se flag)
4. Atribuir pontos pela posição (top 5 apenas)
5. Inserir em `atp_points`

### `revert-atp` / `recalculate-all-atp`
Mantêm lógica existente

## 3. Frontend

### Criação de jogo (`NewGame.tsx`)
- Toggle "Grand Slam 🏆" para marcar jogos especiais

### Ranking ATP (`AtpRankingTable.tsx`)
- Mostrar tier de cada jogo nos detalhes
- Info banner explicando o sistema de tiers

### Config (`AtpConfigPanel.tsx`)
- Manter configuração de window_size

### Perfil do jogador
- Gráfico ATP com tiers no tooltip

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Adicionar `tier` em `atp_points`, `is_grand_slam` em `games` |
| `supabase/functions/calculate-ratings/index.ts` | Reescrever `calculate-atp` com lógica de tiers |
| `src/pages/Games/NewGame.tsx` | Toggle Grand Slam |
| `src/components/leaderboard/AtpRankingTable.tsx` | Mostrar tiers |
| `src/pages/Players/PlayerProfile.tsx` | Adaptar gráfico ATP |

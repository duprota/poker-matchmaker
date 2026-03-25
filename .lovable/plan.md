

# Tela de Conclusão de Jogo — Redesign Interativo

## Visão Geral

Transformar a tela de summary atual (cards estáticos com texto) em uma experiência visual e celebratória que destaca os avatares dos jogadores, especialmente do vencedor.

## Layout Proposto (mobile-first, 390px)

```text
┌─────────────────────────────┐
│   ✨ NOME DO JOGO ✨        │
│   📍 Local • 🕐 Duração     │
├─────────────────────────────┤
│                             │
│      🏆 (coroa animada)     │
│    ┌─────────────────┐      │
│    │   AVATAR GRANDE  │     │
│    │   (120px, glow   │     │
│    │    dourado)      │     │
│    └─────────────────┘      │
│      NOME DO VENCEDOR       │
│       +$450  (ROI 150%)     │
│                             │
├─────────────────────────────┤
│  PÓDIO (2º e 3º lugar)     │
│  ┌──────┐     ┌──────┐     │
│  │avatar│     │avatar│     │
│  │ 2º   │     │ 3º   │     │
│  │+$200 │     │+$50  │     │
│  └──────┘     └──────┘     │
├─────────────────────────────┤
│  DEMAIS JOGADORES           │
│  avatar nome      resultado │
│  avatar nome      resultado │
├─────────────────────────────┤
│  STATS (grid 2x2)          │
├─────────────────────────────┤
│  [📤 Compartilhar]         │
└─────────────────────────────┘
```

## Mudanças Necessárias

### 1. Incluir `avatar_url` nos dados do jogo
- **`src/types/game.ts`**: Adicionar `avatar_url?: string | null` ao tipo `player` dentro de `GamePlayer`
- **`src/hooks/useGameDetails.tsx`**: Incluir `avatar_url` no select de `players`

### 2. Redesenhar `WinnerCard.tsx` → Seção de destaque do vencedor
- Avatar grande (120px) com borda dourada animada (glow pulsante)
- Ícone de coroa/troféu posicionado acima do avatar
- Nome em gradiente dourado, lucro e ROI abaixo
- Fallback: usar `boring-avatars` (Beam) quando sem avatar — importar da lib já instalada
- Confetti visual usando CSS keyframes (partículas com `::before`/`::after`)

### 3. Criar componente `PodiumSection.tsx`
- Mostra 2º e 3º lugar lado a lado com avatares médios (64px)
- Medalhas de prata e bronze com cores correspondentes
- Resultados financeiros abaixo de cada avatar

### 4. Redesenhar `Rankings.tsx` → Lista dos demais jogadores
- Cada linha agora inclui o avatar (32px) ao lado do nome
- Manter cores verde/vermelho para resultados
- Remover os 3 primeiros (já estão no pódio)

### 5. Atualizar `GameSummary.tsx`
- Reordenar: Overview → Winner → Podium → Rankings (4º em diante) → Stats → Share
- Adicionar animações escalonadas (delay progressivo no `animate-fade-in`)

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `src/types/game.ts` | Adicionar `avatar_url` ao player |
| `src/hooks/useGameDetails.tsx` | Incluir `avatar_url` no select |
| `src/components/games/summary/WinnerCard.tsx` | Redesenhar com avatar grande e glow |
| `src/components/games/summary/PodiumSection.tsx` | Criar novo — 2º e 3º lugar |
| `src/components/games/summary/Rankings.tsx` | Avatares + excluir top 3 |
| `src/components/games/GameSummary.tsx` | Integrar PodiumSection |


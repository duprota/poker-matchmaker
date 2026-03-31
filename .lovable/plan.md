

## Entendimento

Atualmente, quando um jogo é finalizado, os badges conquistados aparecem como uma **animação sequencial que bloqueia a tela** (cada badge aparece por 2.4s e some, um a um). Só depois de todas passarem é que o resumo do jogo é exibido. O pedido é:

- Remover esse comportamento de animação bloqueante
- Mostrar os badges **estaticamente** em um grid de até 3 por linha
- Posicionar **depois do Game Statistics** e **antes do ShareButton** (que o usuário chama de "gráfico de evolução")

## Avaliação

Faz total sentido. A animação sequencial é fácil de perder (se o usuário não está olhando) e bloqueia o acesso ao resumo. Um grid estático integrado ao fluxo do resumo é mais útil — o usuário vê tudo de uma vez, no contexto certo.

## Plano

### Arquivo: `src/components/games/GameSummary.tsx`

1. **Remover** o estado `showBadges` e o `handleBadgeAnimationComplete`
2. **Remover** o bloco condicional que renderiza `<BadgeAnimation>` antes do resumo (linhas 94-103)
3. **Adicionar** uma seção estática de badges entre `<GameStats>` e `<ShareButton>`, renderizada apenas quando `gameBadges?.length > 0`:
   - Card com título "🏅 Badges Conquistadas"
   - Grid `grid-cols-3` com cada badge mostrando: emoji grande, nome do badge, nome do jogador
   - Mesmo padrão de `animate-fade-in` com delay sequencial

### Arquivo: `src/components/badges/BadgeAnimation.tsx`

- Nenhuma alteração necessária (pode ser mantido para uso futuro ou removido depois)

### Estrutura do grid de cada badge

```
┌──────────┬──────────┬──────────┐
│  🎯      │  🔥      │  🚄      │
│ Sniper   │ Fênix    │ Trem Bala│
│ João     │ Maria    │ Pedro    │
└──────────┴──────────┴──────────┘
```

Cada item: emoji (text-3xl), badge_name (text-sm font-semibold), player_name (text-xs text-muted). Centralizado. Fundo sutil com borda.


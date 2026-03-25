

# Avatar Upload — Melhoria com Bibliotecas Especializadas

## Problemas Atuais

1. **Câmera**: Captura um frame instantâneo sem mostrar viewfinder ao vivo — o usuário não vê o que está fotografando.
2. **Crop**: `react-image-crop` funciona, mas a UX é rígida — o usuário arrasta um retângulo. Não tem zoom nem rotação.
3. **Mobile**: A interação de arrastar o crop box é difícil em tela pequena.

## Biblioteca Recomendada: `react-easy-crop`

| Critério | react-image-crop (atual) | react-easy-crop | react-avatar-editor |
|----------|-------------------------|-----------------|---------------------|
| UX Mobile | Fraca (arrastar box) | Excelente (pinch-zoom) | Boa |
| Zoom/Rotate | Não | Sim (slider) | Sim |
| Circular crop | Sim | Sim (nativo) | Sim |
| Bundle size | ~15KB | ~10KB | ~12KB |
| Manutenção | Ativa | Ativa | Baixa |

**`react-easy-crop`** é a melhor opção: o usuário move a imagem com drag (ou pinch no mobile) dentro de uma área circular fixa, com slider de zoom. Muito mais natural que arrastar cantos de um box.

## Solução para Câmera: Viewfinder ao Vivo

Em vez de capturar um frame cego, mostrar um **video live** em tela cheia com botão de captura (estilo câmera de celular). Fluxo:

```text
[Tap avatar] → Dialog: "Upload" ou "Câmera"
                          ↓ Câmera
                    Tela com video ao vivo
                    [  Botão circular ⊙  ]
                          ↓ Tap
                    Congela frame → Crop com react-easy-crop
                          ↓ Salvar
                    Upload ao Supabase
```

## Mudanças no `AvatarUploader.tsx`

1. **Substituir** `react-image-crop` por `react-easy-crop`
   - Remover `ReactCrop` e seu CSS
   - Usar `Cropper` do react-easy-crop com `cropShape="round"` e `showGrid={false}`
   - Adicionar slider de zoom abaixo do cropper
   - Usar `getCroppedImg` helper com canvas (da doc oficial do react-easy-crop)

2. **Viewfinder ao vivo para câmera**
   - Ao escolher "Câmera", abrir Sheet com `<video>` renderizado em tela cheia (stream da câmera)
   - Botão circular grande na parte inferior para capturar
   - Ao capturar: pausa stream, converte frame para dataURL, abre o cropper
   - Botão para alternar câmera frontal/traseira (se disponível)

3. **Input de arquivo mobile-friendly**
   - Adicionar `capture="environment"` como opção para permitir ao navegador abrir a câmera nativa do celular diretamente (alternativa ao viewfinder custom)

## Arquivos Impactados

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar `react-easy-crop`, remover `react-image-crop` |
| `src/components/players/AvatarUploader.tsx` | Reescrever crop com react-easy-crop + viewfinder ao vivo |

## Resultado Esperado

- Crop: drag/pinch para posicionar, slider para zoom, preview circular
- Câmera: viewfinder ao vivo com botão de captura, troca de câmera
- Mobile: pinch-to-zoom nativo, botões grandes, tela cheia


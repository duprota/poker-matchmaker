
# Reabrir jogos e corrigir despesas com segurança

## Na interface
- Adicionar **Reabrir jogo** às partidas concluídas, com confirmação explicando os efeitos sobre rankings e contas.
- Manter buy-ins, rebuys e fichas finais preenchidos para correção; permitir nova finalização.
- Adicionar **Editar despesa** a cada despesa existente, inclusive ligada a uma partida concluída. Abrir o formulário atual preenchido, permitindo alterar descrição, valor, pagador, participantes e divisão.
- Manter o formulário aberto e preservar os valores digitados se o salvamento falhar.

## Consistência das contas
- Preservar despesas ao reabrir a partida e preservar todos os pagamentos já realizados.
- Retirar apenas os lançamentos de resultado da partida reaberta, sem apagar pagamentos ou despesas. Recriar os resultados corrigidos ao finalizar novamente, sem duplicação.
- Ao editar uma despesa, registrar diferenças por jogador no livro-caixa, em uma única operação junto com a despesa e suas parcelas. Não reescrever pagamentos anteriores.
- Substituir propostas de acerto ainda pendentes por propostas calculadas com os novos saldos; conservar o histórico e comprovantes dos acertos pagos.

## Rankings e estatísticas
- Atualizar ranking padrão a partir de partidas concluídas.
- Recalcular Skill e histórico cronologicamente, incluindo partidas posteriores afetadas; atualizar ATP, RT/RR, arquétipos, parâmetros de probabilidades e badges usando os resultados válidos.
- Não aplicar simplesmente a reversão do último Skill para partidas antigas: isso invalidaria os resultados posteriores.
- Usar somente partidas concluídas no histórico dos gráficos; não inventar horários de rebuys nem recriar evolução ao vivo sem registros.
- Mostrar qualquer falha de recálculo e permitir tentar novamente, sem anunciar sucesso completo enquanto houver etapas pendentes.

## Detalhes técnicos
- Criar operações transacionais no Supabase para reabertura e edição de despesas, com usuário autenticado e autorização verificada no servidor conforme o responsável pela partida/despesa.
- Coordenar recálculos no servidor com controle de concorrência, idempotência e estado persistido de processamento/erro. Evitar cadeias dependentes de a pessoa manter a página aberta.
- Revisar os cálculos existentes antes de reutilizá-los: atualmente algumas falhas são ignoradas, a finalização não é atômica e as badges podem depender de outras partidas.
- Reutilizar os controles e formulários existentes, atualizando as telas de jogos, despesas, rankings e contas após confirmação.

## Verificação
- Testar partida recente e antiga, duas reaberturas simultâneas, nova finalização, falha parcial e recuperação.
- Testar edição de valor, pagador e participantes de despesa; conferir diferenças exatas de saldo e preservação de pagamentos pagos.
- Validar em partidas e despesas isoladas, sem alterar registros reais para testes. A verificação autenticada na interface depende de sessão disponível no projeto externo.
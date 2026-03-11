

# WhatsApp Bot — Plano com Sessão Explícita

## Resumo do Comportamento

1. **Fora de sessão**: Bot ignora 100% das mensagens. Zero custo de LLM.
2. **Ativação**: Alguém envia mensagem contendo o trigger (`@bot`, `/bot`). Bot abre sessão e processa a mensagem.
3. **Sessão aberta**: Bot processa **todas** as mensagens do grupo (envia ao LLM para entender e responder). Timer reinicia a cada mensagem processada.
4. **Encerramento por timeout**: Após X minutos sem mensagens, sessão fecha automaticamente.
5. **Encerramento por dispensa**: Se o usuário diz "obrigado", "valeu", "não preciso mais", etc., o LLM detecta a dispensa como intent e o bot fecha a sessão e se despede.

```text
Mensagem chega → Contém trigger?
  SIM → Abre/renova sessão → Processa com LLM → Responde
  NÃO → Sessão ativa?
    NÃO → Ignora (return 200)
    SIM → Timeout expirou?
      SIM → Fecha sessão, ignora
      NÃO → Envia ao LLM → Intent = dismiss?
        SIM → Fecha sessão, responde despedida
        NÃO → Responde normalmente, renova timer
```

## Banco de Dados (3 tabelas novas)

### `bot_config` (linha única)
| Coluna | Tipo | Default |
|--------|------|---------|
| id | uuid PK | gen_random_uuid() |
| api_url | text | — |
| instance_name | text | — |
| group_id | text | — |
| bot_trigger | text | '@bot' |
| session_timeout_minutes | int | 5 |
| enabled | boolean | false |
| created_at | timestamptz | now() |

### `bot_sessions` (sessões ativas)
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| group_id | text | JID do grupo |
| started_by_phone | text | Quem ativou |
| last_activity_at | timestamptz | Atualizado a cada mensagem |
| is_active | boolean | false quando fechada |
| context_messages | jsonb | Últimas mensagens para contexto do LLM |
| created_at | timestamptz | |

### `bot_message_logs` (histórico)
| Coluna | Tipo |
|--------|------|
| id | uuid PK |
| direction | text ('inbound'/'outbound'/'ignored') |
| phone | text |
| message_type | text ('text'/'audio'/'image') |
| message_text | text |
| parsed_intent | text (nullable) |
| session_id | uuid FK (nullable) |
| status | text |
| created_at | timestamptz |

RLS aberto (mesmo padrão do projeto — acesso público sem auth).

## Edge Function 1: `whatsapp-webhook`

Recebe POST da Evolution API. Lógica principal:

```text
1. Parse payload (texto/áudio/imagem, telefone, grupo)
2. Busca bot_config → se !enabled, return 200
3. Verifica trigger no texto da mensagem
   - Trigger presente → cria ou renova sessão em bot_sessions
   - Trigger ausente → busca sessão ativa (is_active=true, last_activity_at + timeout > now)
     - Sem sessão ativa → loga
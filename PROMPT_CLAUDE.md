# 🤖 Prompt de Contexto & Instruções — Kora (Claude Edition)

> **Instruções para o Claude:** Leia atentamente todo o documento antes de iniciar. Este repositório já possui uma base Next.js 16 funcional e banco de dados Supabase configurado. Siga as diretrizes de engenharia, uso de ferramentas e boas práticas descritas abaixo.

---

## 📌 1. Visão Geral do Sistema: Kora
O **Kora** é um sistema pessoal de controle financeiro automatizado com cockpit moderno e captura de transações em linguagem natural.

### Fluxo Principal de Dados:
1. **Input do Usuário:** Envio de áudios ou textos informais no Telegram (ex: *"Bk 47,30 sendo que 19 o Kajan passou"* ou *"vendi 2 whey por 178 no pix"*).
2. **Processamento Serverless (Next.js Native):** O Next.js recebe o webhook do Telegram, baixa o áudio, transcreve via Whisper API (OpenAI), passa por uma LLM (`gpt-4o-mini` / `claude-3-5-sonnet`) para estruturar em JSON e insere na tabela `transacoes` do Supabase.
3. **Feedback Instantâneo:** O bot responde no Telegram com um card formatado confirmando os dados registrados.
4. **Dashboard em Tempo Real:** A interface do Kora atualiza na hora via **Supabase Realtime** sem necessidade de refresh (F5).

---

## 💻 2. Stack Técnica & Estado Atual do Código

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Componentes UI (shadcn/ui):** `card`, `table`, `badge`, `button`, `input`, `select`, `dialog`.
- **Banco de Dados:** Supabase (PostgreSQL) — migrado e ativo no projeto `supabase-pwlabs`.
- **Variáveis de Ambiente (`.env.local` já configurado):**
  - `NEXT_PUBLIC_SUPABASE_URL=https://hzzzwoihtycxpqkeyxxb.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`

### 📂 Arquivos já existentes no projeto:
- `src/types/finance.ts` e `src/types/database.ts` (Tipos TypeScript estritos).
- `src/lib/supabase/client.ts` e `src/lib/supabase/server.ts` (Clientes Supabase Browser e SSR Server).
- `src/lib/formatters.ts` (Formatadores de moeda BRL, datas e badges).
- `src/components/dashboard/` (Header, SummaryCards, CashFlowChart, CategoryBreakdown, TransactionTable, TransactionModal, DashboardView).
- `src/app/page.tsx` (Dashboard principal com SSR e Realtime).
- `supabase/schema.sql` (Script SQL de migração executado no Supabase).

---

## 🗄️ 3. Estrutura da Tabela no Supabase (`transacoes`)

| Coluna | Tipo | Descrição / Regras |
| :--- | :--- | :--- |
| `id` | `UUID` | Chave primária (gerada automaticamente) |
| `created_at` | `TIMESTAMPTZ` | Data/hora de criação |
| `descricao` | `TEXT` | Nome do estabelecimento ou descrição do item |
| `valor` | `NUMERIC(10,2)` | Valor líquido em reais |
| `tipo` | `ENUM` | `'ENTRADA'` \| `'SAIDA_PAGA'` \| `'SAIDA_PENDENTE'` |
| `categoria` | `TEXT` | Ex: Alimentação, Mercado, Transporte, Salário, etc. |
| `forma_pagamento` | `ENUM` | `'PIX'` \| `'DEBITO'` \| `'CREDITO'` \| `'DINHEIRO'` |
| `observacao` | `TEXT` | Mensagem original do Telegram ou contexto de divisão |
| `data_transacao` | `DATE` | Data da compra / recebimento (`YYYY-MM-DD`) |
| `data_vencimento` | `DATE` | Data de vencimento (opcional para pendentes) |

---

## 🧠 4. Diretrizes de Engenharia e Instruções para o Claude

### 🛠️ Uso de Ferramentas, MCP e Skills:
1. **MCP Filesystem / Git:** Inspecione os arquivos existentes antes de criar novos para manter consistência com padrões e imports (`@/*`).
2. **Tipagem Estrita:** Utilize sempre os tipos definidos em `@/types/finance` e `@/types/database`.
3. **Clean Architecture & Modularidade:**
   - Mantenha funções utilitárias do Telegram em `src/lib/telegram/`.
   - Mantenha a lógica da OpenAI/Whisper em `src/lib/ai/`.
   - Mantenha a rota em `src/app/api/telegram/webhook/route.ts`.
4. **Resiliência e Tratamento de Erros:**
   - Adicione `try/catch` robustos em chamadas externas (Telegram API, Whisper, OpenAI, Supabase).
   - Retorne status `200 OK` para o webhook do Telegram mesmo em caso de erro de parse para evitar retentativas infinitas da API do Telegram, enviando uma mensagem amigável no chat (ex: *"⚠️ Não consegui identificar a transação. Tente novamente com mais detalhes.*").
5. **Segurança:**
   - Validar `TELEGRAM_SECRET_TOKEN` no header do webhook se fornecido.
   - Não expor chaves privadas no frontend.

---

## 🎯 5. Tarefa Imediata: Implementar a Rota do Webhook do Telegram

### Subtarefas detalhadas:

#### 1. Variáveis de Ambiente Necessárias
Adicionar ao `.env.local` e `.env.example`:
- `TELEGRAM_BOT_TOKEN=...`
- `OPENAI_API_KEY=...`
- `TELEGRAM_WEBHOOK_SECRET=...` (opcional, para validação de segurança)

#### 2. Módulo do Telegram (`src/lib/telegram/bot.ts`)
- Função `downloadTelegramFile(fileId: string): Promise<Buffer>` (utiliza `getFile` e faz o fetch do binário).
- Função `sendTelegramMessage(chatId: number | string, text: string, parseMode?: 'Markdown' | 'HTML'): Promise<void>`.

#### 3. Módulo de IA & Whisper (`src/lib/ai/extractor.ts`)
- Função `transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string>` via OpenAI Whisper API (`v1/audio/transcriptions`).
- Função `extractTransactionFromText(text: string): Promise<NovaTransacaoInput[]>`:
  - System prompt com regras de negócio:
    - Identificar `ENTRADA` vs `SAIDA_PAGA` vs `SAIDA_PENDENTE`.
    - Identificar método de pagamento (`PIX`, `DEBITO`, `CREDITO`, `DINHEIRO`).
    - Calcular divisões (ex: *"Bk 47,30 sendo que 19 o Kajan passou"* -> valor `28.30`, obs *"Bk 47,30 sendo que 19 o Kajan passou"*).
    - Suporte a múltiplas transações na mesma frase.
  - Usar Structured Output (Zod / JSON Schema) ou resposta JSON pura para máxima confiabilidade.

#### 4. Endpoint do Webhook (`src/app/api/telegram/webhook/route.ts`)
- `POST`: Recebe o payload do Telegram.
- Diferencia se é `message.voice`, `message.audio` ou `message.text`.
- Executa a transcrição + extração.
- Salva no Supabase (`transacoes`).
- Envia mensagem no Telegram formatada com emojis e resumo do lançamento.

#### 5. Script Helper para Configuração do Webhook
- Criar `scripts/set-webhook.ts` ou rota `/api/telegram/setup` que executa:
  `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<NGROK_OR_VERCEL_URL>/api/telegram/webhook`

---

## ✅ Critérios de Aceite
1. Enviar um texto como *"Almoço 32,50 no débito"* no Telegram insere no Supabase e responde com confirmação.
2. Enviar um áudio de voz com a mesma frase faz a transcrição com Whisper, extrai o JSON, insere no Supabase e responde no Telegram.
3. Transação aparece instantaneamente no Dashboard (`http://localhost:3000`) via Realtime.

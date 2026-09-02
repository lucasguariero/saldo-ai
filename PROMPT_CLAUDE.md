# 🤖 Contexto & Instruções — Kora (Claude Edition)

> ⚠️ **AVISO IMPORTANTE:** 
> **ESTE PROJETO NÃO UTILIZA TELEGRAM, N8N, NGROK OU QUALQUER BOT EXTERNO.**
> O Kora é um **Web App nativo construído em Next.js 16**. Toda a captura de voz e comandos de IA acontece diretamente na interface web via navegador/celular.

---

## 📌 1. Visão Geral do Sistema: Kora
O **Kora** é um painel de inteligência financeira pessoal automatizado com cockpit moderno e captura de transações por voz e texto em linguagem natural.

### Fluxo de Dados:
1. **Input:** O usuário clica no botão de microfone na barra `VoiceCommandBar` no Dashboard (`/`) ou digita um texto informal (ex: *"Bk 47,30 sendo que 19 o Kajan passou"*).
2. **Processamento Serverless:** A requisição é enviada para `/api/ai/process-transaction`.
3. **IA (Whisper + GPT-4o-mini):** O Whisper transcreve o áudio e o GPT-4o-mini calcula o valor líquido (ex: 47.30 - 19.00 = 28.30), classifica a categoria e identifica o método de pagamento.
4. **Persistência:** As transações são inseridas na tabela `transacoes` do Supabase.
5. **Dashboard em Tempo Real:** O dashboard é atualizado instantaneamente via **Supabase Realtime**.

---

## 💻 2. Stack Técnica & Estado do Projeto
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Componentes UI:** shadcn/ui (`card`, `table`, `badge`, `button`, `input`, `select`, `dialog`).
- **Banco de Dados:** Supabase (PostgreSQL) — Tabela `transacoes` já migrada e ativa no projeto `supabase-pwlabs`.
- **IA / Áudio:** OpenAI API (`whisper-1` + `gpt-4o-mini`).
- **Variáveis de Ambiente (`.env.local`):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`

---

## 🗄️ 3. Estrutura da Tabela (`transacoes`)
- `id` (UUID, PK)
- `created_at` (TIMESTAMPTZ)
- `descricao` (TEXT)
- `valor` (NUMERIC 10,2)
- `tipo` (ENUM: `'ENTRADA'`, `'SAIDA_PAGA'`, `'SAIDA_PENDENTE'`)
- `categoria` (TEXT)
- `forma_pagamento` (ENUM: `'PIX'`, `'DEBITO'`, `'CREDITO'`, `'DINHEIRO'`)
- `observacao` (TEXT, opcional)
- `data_transacao` (DATE: `YYYY-MM-DD`)
- `data_vencimento` (DATE: `YYYY-MM-DD`, opcional para pendentes)

---

## 📂 4. Arquivos Principais do Projeto
- `src/app/page.tsx` — Dashboard com SSR e Supabase Realtime.
- `src/app/api/ai/process-transaction/route.ts` — API Route que recebe áudio/texto e salva no Supabase.
- `src/components/dashboard/voice-command-bar.tsx` — Barra de captura de voz (MediaRecorder) e texto com IA.
- `src/components/dashboard/summary-cards.tsx` — 4 KPI Cards (Entradas, Saídas Pagas, Pendentes, Saldo).
- `src/components/dashboard/transaction-table.tsx` — Extrato de transações com busca, filtros e ações.
- `src/components/dashboard/cash-flow-chart.tsx` — Gráfico de fluxo financeiro (Recharts).
- `src/components/dashboard/category-breakdown.tsx` — Gastos por categoria com barras de progresso.
- `src/lib/ai/extractor.ts` — Serviços de transcrição (Whisper) e estruturação de transações (GPT-4o-mini).
- `src/lib/supabase/client.ts` e `server.ts` — Clientes Supabase.
- `src/types/finance.ts` e `database.ts` — Tipagens estritas.

---

## 🧠 5. Diretrizes para o Claude
1. **Nunca crie rotas de webhook do Telegram, nem utilize ngrok, n8n ou bibliotecas de bot.**
2. Todas as novas features devem ser adicionadas como componentes do Next.js ou rotas de API internas.
3. Utilize sempre as tipagens de `@/types/finance` e componentes existentes em `@/components/ui/`.

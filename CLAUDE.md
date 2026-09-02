# Kora — Sistema de Gestão Financeira com Voice AI

> ⚠️ **DIRETRIZ CRÍTICA DE ARQUITETURA:** 
> **NÃO UTILIZAMOS TELEGRAM, N8N, NGROK NEM BOTS EXTERNOS.**
> O Kora é um **Web App nativo (Next.js 16)** com gravação de áudio e comandos de IA integrados diretamente na interface web (`/` e `/api/ai/process-transaction`).

---

## 📌 1. Visão Geral do Projeto
- **Nome:** Kora
- **Objetivo:** Painel financeiro pessoal com captura de transações por voz (microfone no navegador/celular) e texto informal, cálculos automáticos de divisões de conta e atualização em tempo real.
- **Fluxo de Captura:**
  1. Usuário grava áudio ou digita na barra `VoiceCommandBar` no Dashboard (`/`).
  2. O componente envia o áudio/texto para a rota `/api/ai/process-transaction`.
  3. A rota usa **OpenAI Whisper** (`whisper-1`) para transcrever áudio e **GPT-4o-mini** para estruturar a transação em JSON.
  4. As transações são salvas diretamente no **Supabase** (`public.transacoes`).
  5. O Dashboard atualiza instantaneamente na tela via **Supabase Realtime**.

---

## 💻 2. Stack Técnica
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **UI Components:** shadcn/ui (`card`, `table`, `badge`, `button`, `input`, `select`, `dialog`).
- **Banco de Dados:** Supabase (PostgreSQL) — Tabela `transacoes`.
- **IA / Audio:** OpenAI SDK (`whisper-1` + `gpt-4o-mini`).

---

## 🗄️ 3. Estrutura do Banco (Supabase `transacoes`)
- `id` (UUID, PK)
- `created_at` (TIMESTAMPTZ)
- `descricao` (TEXT)
- `valor` (NUMERIC 10,2) — valor líquido
- `tipo` (ENUM: `'ENTRADA'`, `'SAIDA_PAGA'`, `'SAIDA_PENDENTE'`)
- `categoria` (TEXT) — Ex: Alimentação, Mercado, Transporte, Salário, etc.
- `forma_pagamento` (ENUM: `'PIX'`, `'DEBITO'`, `'CREDITO'`, `'DINHEIRO'`)
- `observacao` (TEXT) — Contexto original / divisão de conta
- `data_transacao` (DATE: `YYYY-MM-DD`)
- `data_vencimento` (DATE: `YYYY-MM-DD`, opcional para pendentes)

---

## 📂 4. Estrutura de Arquivos Principais
- `src/app/page.tsx` — Página principal com SSR e listener do Supabase Realtime.
- `src/app/api/ai/process-transaction/route.ts` — Endpoint de processamento de voz/texto com IA.
- `src/components/dashboard/voice-command-bar.tsx` — Barra com microfone (MediaRecorder), timer e input de texto.
- `src/components/dashboard/summary-cards.tsx` — 4 KPI Cards (Entradas, Saídas Pagas, Pendentes, Saldo).
- `src/components/dashboard/transaction-table.tsx` — Extrato com filtros, busca e edição.
- `src/components/dashboard/cash-flow-chart.tsx` — Gráfico de fluxo financeiro diário (Recharts).
- `src/components/dashboard/category-breakdown.tsx` — Gastos por categoria com barras de progresso.
- `src/lib/ai/extractor.ts` — Lógica do Whisper e GPT-4o-mini com prompt financeiro.
- `src/lib/supabase/client.ts` e `server.ts` — Clientes Supabase com suporte a Realtime.
- `src/types/finance.ts` e `database.ts` — Tipagens estritas em TypeScript.

---

## 🔑 5. Variáveis de Ambiente (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

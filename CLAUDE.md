# Saldo AI / Jarvis — CRM Operacional Multi-Workspace

> ⚠️ **DIRETRIZ CRÍTICA DE ARQUITETURA:** 
> **NÃO UTILIZAMOS TELEGRAM, N8N, NGROK NEM BOTS EXTERNOS.**
> O sistema é um **Web App nativo PWA (Next.js 16)** com comandos de voz e IA executados diretamente no navegador/celular via OpenRouter (Gemini 2.5 Flash / GPT-4o-mini) e persistência no Supabase.

---

## ⚡ 1. Comandos Rápidos de Execução (Mobile Shortcuts):
O usuário está operando pelo celular. Quando ele digitar um comando curto, execute imediatamente lendo o arquivo correspondente na íntegra, sem pedir explicações extras:

- Se o usuário digitar **`spec`** ou **`executar spec`**:
  $\rightarrow$ Leia [`SPEC_EXECUCAO_CLAUDE_CODE.md`](./SPEC_EXECUCAO_CLAUDE_CODE.md), execute todas as 5 fases atômicas sequencialmente, validando o build e commitando ao final de cada fase.
- Se o usuário digitar **`task 5`** ou **`executar task 5`**:
  $\rightarrow$ Leia [`TASK_5_MOBILE_SHELL_BOTTOM_NAV.md`](./TASK_5_MOBILE_SHELL_BOTTOM_NAV.md), implemente todos os passos, valide com `npm run build` e faça o commit e push para o GitHub.
- Se o usuário digitar **`task 6`** ou **`executar task 6`**:
  $\rightarrow$ Leia [`TASK_6_GSTORE_BENCHMARK_STORAGE.md`](./TASK_6_GSTORE_BENCHMARK_STORAGE.md), implemente todos os passos, valide com `npm run build` e faça o commit e push para o GitHub.
- Se o usuário digitar **`task 7`** ou **`executar task 7`**:
  $\rightarrow$ Leia [`TASK_7_PWLABS_ACTO_WORKSPACES.md`](./TASK_7_PWLABS_ACTO_WORKSPACES.md), implemente todos os passos, valide com `npm run build` e faça o commit e push para o GitHub.
- Se o usuário digitar **`task 8`** ou **`executar task 8`**:
  $\rightarrow$ Leia [`TASK_8_JARVIS_DISPATCHER_INBOX.md`](./TASK_8_JARVIS_DISPATCHER_INBOX.md), implemente todos os passos, valide com `npm run build` e faça o commit e push para o GitHub.

---

## 📌 2. Visão Geral e os 4 Workspaces
O sistema atua como o cockpit operacional central de 4 ecossistemas:
1. **🛍️ G-Store (Revenda & Afiliados):**
   - Entrada de compras de eletrônicos/produtos via voz/texto.
   - Benchmark real de preços concorrentes via API do Mercado Livre e Google Shopping.
   - Cálculo de preço de giro rápido (piso) e margem máxima (teto).
   - Galeria híbrida no Supabase Storage: fotos oficiais de catálogo + fotos reais tiradas pelo iPhone.
   - Vitrine de Afiliados (sem estoque físico) com comissão tabelada.
2. **🏢 PW Labs (Agência B2B / Serviços):**
   - Pipeline de Deals comercial em Kanban: `Prospecção` ➔ `Proposta` ➔ `Produção` ➔ `Fechado`.
   - Gestão de clientes, valores de propostas e histórico de negociações.
3. **🎯 Acto (Gestão de Produtos & UX):**
   - Acompanhamento enxuto de sprints e demandas para as plataformas (Flora, CityPro) estilo Linear.
4. **👤 Pessoal / Life Admin:**
   - Fluxo de caixa consolidado, controle de contas a pagar/faturas e tarefas de rotina.

---

## 💻 3. Stack Técnica
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **UI Components:** shadcn/ui (`card`, `table`, `badge`, `button`, `input`, `select`, `dialog`, `tabs`).
- **Banco de Dados:** Supabase (PostgreSQL) com RLS e Realtime ativo nas tabelas:
  - `transacoes` (Pessoal)
  - `produtos_estoque` / `gstore_produtos` (G-Store)
  - `crm_deals` (PW Labs)
  - `pessoal_tarefas` / `acto_demandas` (Pessoal e Acto)
- **Mídia:** Supabase Storage (bucket `gstore-produtos`).
- **IA / Audio:** OpenRouter API (`google/gemini-2.5-flash` para transcrição de áudio e classificação multimodal).

---

## 🔑 4. Variáveis de Ambiente (`.env.local` e Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`

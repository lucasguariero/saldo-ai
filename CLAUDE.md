# Saldo AI / Jarvis — CRM Operacional Multi-Workspace

> ⚠️ **DIRETRIZ CRÍTICA DE ARQUITETURA:** 
> **NÃO UTILIZAMOS TELEGRAM, N8N, NGROK NEM BOTS EXTERNOS.**
> O sistema é um **Web App nativo PWA (Next.js 16)** com comandos de voz e IA executados diretamente no navegador/celular via OpenRouter (Gemini 2.5 Flash / GPT-4o-mini) e persistência no Supabase.

---

## 📌 1. Visão Geral e os 4 Workspaces
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

## 💻 2. Stack Técnica
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

## 📋 3. Roteiro de Tarefas para Execução Modular:
Quando for instruído a executar uma tarefa, leia o arquivo correspondente na raiz:
- [`TASK_5_MOBILE_SHELL_BOTTOM_NAV.md`](./TASK_5_MOBILE_SHELL_BOTTOM_NAV.md): Casca Móvel com `BottomNavBar` (safe-area iOS).
- [`TASK_6_GSTORE_BENCHMARK_STORAGE.md`](./TASK_6_GSTORE_BENCHMARK_STORAGE.md): Motor G-Store, Benchmark Mercado Livre e Storage de Fotos.
- [`TASK_7_PWLABS_ACTO_WORKSPACES.md`](./TASK_7_PWLABS_ACTO_WORKSPACES.md): Funil Comercial PW Labs e Demandas da Acto.
- [`TASK_8_JARVIS_DISPATCHER_INBOX.md`](./TASK_8_JARVIS_DISPATCHER_INBOX.md): Dispatcher Central Jarvis e Inbox de Triagem.

---

## 🔑 4. Variáveis de Ambiente (`.env.local` e Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`

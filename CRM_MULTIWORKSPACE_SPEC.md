# ESPECIFICAÇÃO TÉCNICA DE EXECUÇÃO: CRM MULTI-WORKSPACE (SALDO AI / KORA)

> **Destinatário:** Claude Code  
> **Objetivo:** Transformar o sistema atual em um **CRM Central Multi-Workspace** com 3 frentes (`PW Labs`, `G-Store`, `Pessoal`) e fluxo de **Catalogação Inteligente de Produtos via Áudio** para a G-Store.  
> **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + RLS + Realtime), OpenRouter (Gemini 2.5 Flash / GPT-4o-mini).

---

## 📂 MÓDULO 1: BANCO DE DADOS (SUPABASE)

Execute o script de migração no Supabase para suportar os 3 workspaces:

### Arquivo: `supabase/migrations/20260902_multiworkspace_crm.sql`
```sql
-- 1. ENUMs
DO $$ BEGIN
    CREATE TYPE status_produto_gstore AS ENUM (
        'COMPRADO_PREPARACAO', 
        'PENDENTE_ANUNCIO', 
        'ANUNCIADO', 
        'VENDIDO', 
        'DEVOLVIDO'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estagio_deal_pwlabs AS ENUM (
        'PROSPECCAO', 
        'PROPOSTA', 
        'PRODUCAO', 
        'FECHADO', 
        'PERDIDO'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE condicao_produto AS ENUM (
        'NOVO', 
        'USADO_EXCELENTE', 
        'USADO_BOM', 
        'COM_DEFEITO'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabela de Produtos / Estoque (G-Store)
CREATE TABLE IF NOT EXISTS public.produtos_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workspace_id TEXT DEFAULT 'gstore' NOT NULL,
    titulo TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    categoria TEXT DEFAULT 'Eletrônicos',
    condicao condicao_produto DEFAULT 'USADO_EXCELENTE',
    custo_aquisicao NUMERIC(10,2) NOT NULL,
    preco_sugerido_min NUMERIC(10,2),
    preco_sugerido_max NUMERIC(10,2),
    preco_anunciado NUMERIC(10,2),
    preco_venda_final NUMERIC(10,2),
    margem_estimada_perc NUMERIC(5,2),
    status status_produto_gstore DEFAULT 'COMPRADO_PREPARACAO' NOT NULL,
    especificacoes JSONB DEFAULT '{}'::jsonb,
    descricao_anuncio TEXT,
    links_fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
    canais_anuncio TEXT[] DEFAULT ARRAY['OLX', 'FACEBOOK_MARKETPLACE']::TEXT[],
    data_aquisicao DATE DEFAULT CURRENT_DATE NOT NULL,
    data_venda DATE,
    observacao TEXT
);

-- 3. Tabela de Deals / Pipeline B2B (PW Labs)
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workspace_id TEXT DEFAULT 'pwlabs' NOT NULL,
    titulo_deal TEXT NOT NULL,
    empresa TEXT,
    contato_nome TEXT NOT NULL,
    contato_telefone TEXT,
    contato_email TEXT,
    valor_estimado NUMERIC(10,2) DEFAULT 0.00,
    estagio estagio_deal_pwlabs DEFAULT 'PROSPECCAO' NOT NULL,
    servicos TEXT[] DEFAULT ARRAY[]::TEXT[],
    proxima_acao TEXT,
    data_proxima_acao DATE,
    notas TEXT
);

-- 4. Tabela de Tarefas e Rotina (Pessoal)
CREATE TABLE IF NOT EXISTS public.pessoal_tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workspace_id TEXT DEFAULT 'pessoal' NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    concluida BOOLEAN DEFAULT false NOT NULL,
    prioridade TEXT DEFAULT 'MEDIA',
    data_limite DATE,
    horario TEXT
);

-- 5. Atualizar tabela transacoes
ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'pessoal';

-- 6. Habilitar RLS
ALTER TABLE public.produtos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoal_tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: auth.uid() = user_id
DO $$ BEGIN
    CREATE POLICY "Produtos RLS" ON public.produtos_estoque 
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Deals RLS" ON public.crm_deals 
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Tarefas RLS" ON public.pessoal_tarefas 
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. Adicionar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos_estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pessoal_tarefas;
```

---

## 🧠 MÓDULO 2: INTELIGÊNCIA ARTIFICIAL (DISPATCHER MULTI-INTENT)

Refatorar `src/lib/ai/extractor.ts` para que o bot não assuma apenas despesas financeiras. Ele agora atua como um **Intelligent Classifier & Entity Extractor**:

### Tipos de Saída:
1. `GSTORE_PRODUTO`:
   - Extrai marca, modelo, custo de aquisição, condição e especificações.
   - Gera título otimizado e descrição pronta para OLX/Mercado Livre.
   - Calcula benchmark de preço de venda (mínimo, máximo e sugerido com margem de 30% a 50%).
2. `PWLABS_DEAL`:
   - Extrai empresa, contato, valor da proposta, serviços e estágio no pipeline comercial.
3. `PESSOAL_FINANCE`:
   - Mantém as regras atuais de cálculos de divisão de contas (ex: BK / Kajan), entradas e saídas.
4. `PESSOAL_TAREFA`:
   - Extrai tarefas de rotina, horários e lembretes.

### Prompt do Sistema (`SYSTEM_PROMPT_DISPATCHER`):
```typescript
`Você é o cérebro central do Saldo AI / CRM Multi-Workspace.
Analise a mensagem ou áudio transcrito e identifique qual dos 3 workspaces o comando pertence:

1. GSTORE (Produtos para revenda, compras de eletrônicos/mercadorias para a loja, estoque):
   - Ex: "Comprei um notebook Dell Inspiron 15 i5 11ª geração por 1.800 para vender na loja"
   - Retorne tipo: "GSTORE_PRODUTO"
   - Extraia custo de aquisição, marca, modelo, especificações técnicas, título chamativo para OLX e descrição de anúncio.
   - Calcule preço de venda sugerido (benchmark com margem saudável).

2. PWLABS (B2B / Agência, clientes, reuniões, propostas, contratos de tráfego/landing page):
   - Ex: "Reunião com Dr. Marcos da clínica Sorrir fechou proposta de 4.500 no tráfego pago"
   - Retorne tipo: "PWLABS_DEAL"

3. PESSOAL (Finanças pessoais, alimentação, combustível, contas de casa OU tarefas do dia):
   - Se for financeiro (ex: "Almoço 47,30"): Retorne tipo: "PESSOAL_FINANCE".
   - Se for lembrete/tarefa (ex: "Lembrar de pagar a luz às 16h"): Retorne tipo: "PESSOAL_TAREFA".
`
```

---

## 🖥️ MÓDULO 3: INTERFACE DE USUÁRIO (UI & WORKSPACES)

### 1. Workspace Switcher Global (`src/components/workspace-switcher.tsx`):
- Localizado no Header ou Sidebar.
- 3 opções com ícones e contadores de atenção:
  - 🏢 **PW Labs** (Pipeline B2B)
  - 🛍️ **G-Store** (Estoque & Revenda)
  - 👤 **Pessoal** (Finanças & Rotina)

### 2. Painel da G-Store (`src/components/gstore/gstore-view.tsx`):
- **KPIs do Topo:**
  - 📦 Total Investido em Estoque
  - 📈 Faturamento Projetado
  - 💰 Lucro Bruto Estimado
  - ⚠️ Itens Pendentes de Anúncio
- **Workflow Kanban / Abas de Status:**
  - `Comprado / Em Preparação` (Ação: "Higienizar / Testar")
  - `Pendente de Anúncio` (Badge chamativa: "Tirar Fotos & Anunciar na OLX")
  - `Anunciado` (Canais ativos, tempo anunciado e botão de marcar como vendido)
  - `Vendido` (Histórico de vendas e margem consolidada)
- **Recurso 1-Click Copy:**
  - Botão no card: **"Copiar Anúncio"** (copia o título SEO + descrição técnica formatada para colar direto na OLX / Mercado Livre).

### 3. Painel do PW Labs (`src/components/pwlabs/deals-kanban.tsx`):
- Colunas do Pipeline:
  - 🎯 **Prospecção**
  - 📑 **Proposta Enviada**
  - ⚙️ **Produção / Onboarding**
  - 🤝 **Fechado** (Ganha)
- Cards com valor da oportunidade, contato, próxima ação e tags de serviço.

### 4. Triagem Inteligente de Áudio (`src/components/dashboard/triage-card.tsx`):
- Quando um áudio é processado, a interface exibe um card de confirmação com badge do workspace detectado:
  - *"🛍️ G-Store Detectado: Dell Inspiron 15 (Custo: R$ 1.800 | Sugestão Venda: R$ 2.490). Deseja cadastrar no Estoque? [Confirmar]"*
- Permite alterar o workspace com 1 clique antes de salvar.

---

## 📋 GUIA DE EXECUÇÃO MODULAR (ROTEIRO PARA O CLAUDE CODE)

Copie e cole os comandos abaixo para o Claude Code executar fase por fase:

### 🔹 Passo 1: Modelos e Migração do Banco
```bash
claude "Crie o arquivo supabase/migrations/20260902_multiworkspace_crm.sql com as tabelas produtos_estoque, crm_deals e pessoal_tarefas conforme detalhado no CRM_MULTIWORKSPACE_SPEC.md. Atualize src/types/database.ts e crie src/types/crm.ts com as interfaces completas de ProdutoEstoque, CRMDeal e TarefaPessoal."
```

### 🔹 Passo 2: Router de IA & Enriquecimento da G-Store
```bash
claude "Refatore src/lib/ai/extractor.ts para implementar o Dispatcher Multi-Workspace com OpenRouter (Gemini 2.5 Flash). O extrator deve classificar a intenção entre GSTORE_PRODUTO, PWLABS_DEAL, PESSOAL_FINANCE e PESSOAL_TAREFA. Para a G-Store, gere título otimizado, especificações JSON, descrição pronta para marketplace e estimativa de faixa de preço de venda (mínimo, máximo e sugerido com margem de 35%). Atualize a rota src/app/api/ai/process-transaction/route.ts para salvar na tabela correspondente ao workspace detectado."
```

### 🔹 Passo 3: Workspace Switcher & Telas da G-Store e PW Labs
```bash
claude "Crie os componentes de UI:
1. src/components/layout/workspace-switcher.tsx para alternar entre PW Labs, G-Store e Pessoal.
2. src/components/gstore/gstore-view.tsx com os KPIs de estoque, abas de status (Preparação, Pendente de Anúncio, Anunciado, Vendido) e botão de copiar anúncio pronto.
3. src/components/pwlabs/deals-kanban.tsx com o funil comercial (Prospecção, Proposta, Produção, Fechado).
4. Integre tudo em src/app/page.tsx de forma dinâmica baseada no workspace ativo."
```

### 🔹 Passo 4: Build & Verificação
```bash
claude "Execute npm run build para validar que todos os componentes e rotas compilam com 0 erros de tipagem. Commit e envie para o GitHub com a mensagem: 'feat: central multi-workspace CRM with G-Store intelligent audio cataloging'."
```

-- 20260902_multiworkspace_crm.sql
-- CRM Multi-Workspace: PW Labs, G-Store, Pessoal

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

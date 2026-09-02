-- ============================================================
-- KORA: Script de Criação do Banco de Dados no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Criação dos ENUMs (se ainda não existirem)
DO $$ BEGIN
    CREATE TYPE tipo_transacao AS ENUM ('ENTRADA', 'SAIDA_PAGA', 'SAIDA_PENDENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE forma_pagamento AS ENUM ('PIX', 'DEBITO', 'CREDITO', 'DINHEIRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criação da tabela transacoes
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    tipo tipo_transacao NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Geral',
    forma_pagamento forma_pagamento NOT NULL DEFAULT 'PIX',
    observacao TEXT,
    data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE
);

-- 3. Índices para consultas rápidas no Dashboard
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes (data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON public.transacoes (categoria);

-- 4. Habilitar RLS (Row Level Security) e permitir acesso via anon key
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública/Anon
DROP POLICY IF EXISTS "Permitir leitura para anon" ON public.transacoes;
CREATE POLICY "Permitir leitura para anon" 
ON public.transacoes FOR SELECT 
TO anon, authenticated 
USING (true);

-- Política de Inserção para n8n e Dashboard
DROP POLICY IF EXISTS "Permitir insercao para anon" ON public.transacoes;
CREATE POLICY "Permitir insercao para anon" 
ON public.transacoes FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Política de Atualização (Editar / Marcar como Pago)
DROP POLICY IF EXISTS "Permitir atualizacao para anon" ON public.transacoes;
CREATE POLICY "Permitir atualizacao para anon" 
ON public.transacoes FOR UPDATE 
TO anon, authenticated 
USING (true);

-- Política de Exclusão
DROP POLICY IF EXISTS "Permitir exclusao para anon" ON public.transacoes;
CREATE POLICY "Permitir exclusao para anon" 
ON public.transacoes FOR DELETE 
TO anon, authenticated 
USING (true);

-- 5. Habilitar o Supabase Realtime para a tabela transacoes
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes;

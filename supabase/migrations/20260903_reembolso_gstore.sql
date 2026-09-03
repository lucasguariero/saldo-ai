-- 20260903_reembolso_gstore.sql
-- Adicionar campos de reembolso G-Store para conciliação de compras no cartão pessoal

-- 1. Adicionar colunas de reembolso na tabela transacoes
ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS is_reembolso_gstore BOOLEAN DEFAULT false;

ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS reembolso_status TEXT;

ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS reembolso_data TIMESTAMPTZ;

-- 2. Atualizar políticas RLS se necessário (as colunas são opcionais, não precisa de política especial)

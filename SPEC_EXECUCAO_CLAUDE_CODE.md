# 🚀 ESPECIFICAÇÃO TÉCNICA DE EXECUÇÃO — CLAUDE CODE
> **Instrução para Claude Code:** Execute este roteiro de forma estritamente atômica, fase por fase. Não altere caminhos de arquivos nem tome decisões de design além do que está prescrito abaixo. Valide o build com `npm run build` ao final de cada fase antes de commitar.

---

## 📂 1. VISÃO GERAL DOS ARQUIVOS AFETADOS

### Arquivos a Modificar:
1. `src/types/crm.ts` — Adicionar tipos de flips (G-Store), afiliados, console Acto, campanhas PW Labs e OCR financeiro.
2. `src/types/database.ts` — Sincronizar definições do Supabase para novas colunas e tabelas.
3. `src/lib/ai/extractor.ts` — Expandir prompts de extração (copy ancorada G-Store, copy Stories afiliados, OCR visão computacional, copy e-mail B2B).
4. `src/components/gstore/gstore-view.tsx` — Suporte a cálculo de custo líquido com cashback, ancoragem de preço, checkboxes de canais e Stories para afiliados.
5. `src/components/acto/acto-view.tsx` — Trocar projetos para `Inema`, `Eleitores`, `CRM Acto`, adicionar upload de prints, seletor de engine (Gemini vs Claude) e gerador de especificações Tailwind/Stitch/Figma.
6. `src/components/pwlabs/deals-kanban.tsx` — Adicionar aba de E-mail Marketing e Disparos via Resend.
7. `src/components/dashboard/dashboard-view.tsx` — Integrar modal de triagem em lote (Bulk Approval) para OCR de extratos e projeção de fechamento de mês.
8. `package.json` — Adicionar dependência `resend`.

### Arquivos Novos a Criar:
1. `src/app/api/webhooks/pwlabs-lead/route.ts` — Webhook público para receber leads do site e criar deals.
2. `src/app/api/pwlabs/send-campaign/route.ts` — Endpoint de disparo de e-mails em lote via Resend.
3. `src/app/api/pessoal/ocr-extract/route.ts` — Endpoint multimodal (Gemini 2.5 Flash Vision) para extração de extratos/faturas/cupons fiscais em lote.
4. `src/app/api/acto/generate-spec/route.ts` — Endpoint para geração de especificações Tailwind e prompts Stitch/Figma via Gemini ou Claude.
5. `src/components/pessoal/bulk-ocr-modal.tsx` — Modal de conferência em lote com checkboxes para aprovação de transações de prints.

---

## 🗄️ 2. SCHEMA & MIGRATIONS (SQL SUPABASE)

Execute o script SQL abaixo diretamente no banco de dados Supabase para preparar todas as novas colunas e tabelas:

```sql
-- ============================================================
-- 1. G-STORE: ATUALIZAÇÃO DE FLIPS & AFILIADOS
-- ============================================================
ALTER TABLE public.produtos_estoque 
ADD COLUMN IF NOT EXISTS custo_bruto NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS cashback NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo_liquido NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS preco_varejo_referencia NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS canais_venda TEXT[] DEFAULT ARRAY['olx', 'facebook']::TEXT[],
ADD COLUMN IF NOT EXISTS plataforma_afiliado TEXT, -- 'shopee', 'amazon', 'tiktok_shop'
ADD COLUMN IF NOT EXISTS cupom_desconto TEXT,
ADD COLUMN IF NOT EXISTS comissao_estimada_reais NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS copy_stories TEXT;

-- Atualizar enum de status se necessário (ou aceitar string)
-- Status válidos: 'em_transito', 'recebido_sem_fotos', 'anunciado', 'vendido', 'devolvido'

-- ============================================================
-- 2. ACTO: PROJETOS FIXOS & ESPECIFICAÇÕES DE DESIGN
-- ============================================================
CREATE TABLE IF NOT EXISTS public.acto_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    projeto TEXT NOT NULL, -- 'inema', 'eleitores', 'crm_acto'
    titulo TEXT NOT NULL,
    prompt_briefing TEXT,
    imagem_referencia_url TEXT,
    engine_usada TEXT NOT NULL, -- 'gemini-2.5-flash' | 'claude-3.5-sonnet'
    especificacao_markdown TEXT NOT NULL,
    codigo_tailwind TEXT,
    prompt_google_stitch TEXT,
    prompt_figma TEXT
);

ALTER TABLE public.acto_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acto_specs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acto_specs_isolation" ON public.acto_specs;
CREATE POLICY "acto_specs_isolation" ON public.acto_specs
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. PW LABS: MARKETING DE INBOUND & CAMPANHAS RESEND
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pwlabs_campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    titulo TEXT NOT NULL,
    assunto TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    tags_segmentacao TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_enviados INTEGER DEFAULT 0,
    status TEXT DEFAULT 'RASCUNHO' -- 'RASCUNHO', 'ENVIANDO', 'CONCLUIDO'
);

ALTER TABLE public.pwlabs_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pwlabs_campanhas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pwlabs_campanhas_isolation" ON public.pwlabs_campanhas;
CREATE POLICY "pwlabs_campanhas_isolation" ON public.pwlabs_campanhas
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Permitir insert anônimo apenas para o webhook de lead público
DROP POLICY IF EXISTS "pwlabs_webhook_inbound_leads" ON public.crm_deals;
CREATE POLICY "pwlabs_webhook_inbound_leads" ON public.crm_deals
FOR INSERT TO anon WITH CHECK (workspace_id = 'pwlabs');
```

---

## 📝 3. CONTRATOS DE TIPOS (TypeScript)

Atualize `src/types/crm.ts` substituindo e complementando as interfaces a seguir:

```typescript
// src/types/crm.ts

export type StatusFlipGStore = 
  | 'em_transito' 
  | 'recebido_sem_fotos' 
  | 'anunciado' 
  | 'vendido' 
  | 'devolvido';

export type CanalVenda = 'olx' | 'facebook' | 'site' | 'instagram';
export type PlataformaAfiliado = 'shopee' | 'amazon' | 'tiktok_shop';
export type ProjetoActo = 'inema' | 'eleitores' | 'crm_acto';
export type EngineDesign = 'gemini' | 'claude';

export interface ProdutoEstoque {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: 'gstore';
  tipo_operacao: 'REVENDA_ESTOQUE' | 'AFILIADO';
  titulo: string;
  marca?: string | null;
  modelo?: string | null;
  categoria: string;
  condicao: 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';
  
  // Flip / Arbitragem Financeira
  custo_bruto: number;
  cashback: number;
  custo_liquido: number; // custo_bruto - cashback
  preco_varejo_referencia?: number | null; // Preço novo na loja oficial para ancoragem
  preco_anunciado?: number | null;
  preco_venda_final?: number | null;
  status: StatusFlipGStore;
  canais_venda: CanalVenda[];
  
  // Afiliados
  link_afiliado?: string | null;
  plataforma_afiliado?: PlataformaAfiliado | null;
  cupom_desconto?: string | null;
  comissao_estimada_reais?: number | null;
  copy_stories?: string | null;

  // Mídia & Benchmark
  fotos_referencia?: string[];
  fotos_reais?: string[];
  foto_capa?: string | null;
  descricao_anuncio?: string | null;
  benchmark_concorrentes?: any;
  data_aquisicao: string;
}

export interface ActoSpec {
  id: string;
  created_at: string;
  user_id: string;
  projeto: ProjetoActo;
  titulo: string;
  prompt_briefing?: string;
  imagem_referencia_url?: string;
  engine_usada: EngineDesign;
  especificacao_markdown: string;
  codigo_tailwind?: string;
  prompt_google_stitch?: string;
  prompt_figma?: string;
}

export interface OCRTransacaoExtraida {
  id_temp: string;
  selecionada: boolean;
  descricao: string;
  valor: number;
  tipo: 'SAIDA_PAGA' | 'SAIDA_PENDENTE' | 'ENTRADA';
  data_transacao: string;
  data_vencimento?: string | null;
  categoria: string;
  forma_pagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'BOLETO';
  confianca: number;
}

export interface PWlabsCampanha {
  id: string;
  created_at: string;
  user_id: string;
  titulo: string;
  assunto: string;
  conteudo_html: string;
  tags_segmentacao: string[];
  total_enviados: number;
  status: 'RASCUNHO' | 'ENVIANDO' | 'CONCLUIDO';
}
```

---

## 🛠️ 4. INSTRUÇÕES DE IMPLEMENTAÇÃO POR FASES ATÔMICAS

### 🔹 FASE 1: Banco e Workspaces (Core)
1. **Migrations SQL:** Execute o bloco SQL da Seção 2 no Supabase via script Node temporário ou console.
2. **Atualização de Tipos:** Salve os novos contratos em `src/types/crm.ts` e gere compatibilidade em `src/types/database.ts`.
3. **Instalação de Dependência:**
   ```bash
   npm install resend
   ```
4. **Validação:** Rodar `npm run build` e garantir 0 erros de compilação.

---

### 🔹 FASE 2: G-Store (Flips com Ancoragem + Vitrine de Afiliados)
1. **Regra de Cálculo Automático em `src/components/gstore/gstore-view.tsx`:**
   - Ao cadastrar/editar flip:
     `custo_liquido = custo_bruto - (cashback || 0)`
   - Exibir na UI:
     - Badge de economia do flip: *"Custo Real Líquido: R$ X (R$ Y de cashback)"*.
     - Indicador de Ancoragem: *"Vendido novo por R$ [preco_varejo_referencia] ➔ Anunciado por R$ [preco_anunciado] (Economia de R$ Z / % de desconto)"*.
   - Checkboxes interativas para canais de venda: `[x] OLX  [x] Facebook  [ ] Site  [ ] Instagram`.
   - Mudança de status com botões rápidos: `Em Trânsito` ➔ `Recebido (Sem Fotos)` ➔ `Anunciado` ➔ `Vendido`.
2. **Copywriter com Ancoragem de Preço:**
   - Botão **"📋 Copiar Anúncio Ancorado"**: Gera texto automático:
     > *"🔥 [TITULO] - OPORTUNIDADE*\n*Preço de Varejo (Novo): R$ [preco_varejo_referencia]*\n*Valor na G-Store: APENAS R$ [preco_anunciado] (Economize R$ [economia])!*\n*Condição impecável. Acompanha garantia. Chame no chat!"*
3. **Aba de Afiliados Aprimorada:**
   - Campos: Plataforma (`Shopee`, `Amazon`, `TikTok Shop`), Cupom e Comissão estimada (R$).
   - Botão **"📱 Copiar Copy para Stories"**:
     > *"Achadinho do dia! 🔥 [TITULO] com cupom exclusivo '[CUPOM]'. De R$ X por R$ Y. Link direto nos Stories / Bio!"*
4. **Validação:** Rodar `npm run build`.

---

### 🔹 FASE 3: Acto (Console Mobile de Design & Frontend)
1. **Projetos Fixos:**
   - No arquivo `src/components/acto/acto-view.tsx`, os 3 únicos projetos são:
     - 🏛️ **Inema**
     - 🗳️ **Eleitores**
     - 💼 **CRM Acto**
2. **Upload de Prints & Áudio de Briefing:**
   - Adicionar botão com `<input type="file" accept="image/*" capture="environment" />` para subir print de tela diretamente do rolo do iPhone.
   - Adicionar gravador de microfone para ditar o que deseja alterar na tela (ex: *"Mudar o card de métricas para layout horizontal com badge verde"*).
3. **Endpoint `/api/acto/generate-spec/route.ts`:**
   - Recebe: `projeto`, `prompt_briefing`, `imagem_base64`, `engine` (`gemini` ou `claude`).
   - Se `gemini`: Usa OpenRouter `google/gemini-2.5-flash`.
   - Se `claude`: Usa OpenRouter `anthropic/claude-3.5-sonnet`.
   - Devolve JSON estruturado contendo:
     - `especificacao_markdown`: Descrição dos componentes de UI.
     - `codigo_tailwind`: Trecho de código JSX pronto.
     - `prompt_google_stitch`: Prompt formatado para colar no Google Stitch.
     - `prompt_figma`: Prompt formatado para plugins de IA do Figma.
4. **UI do Console Acto:**
   - Adicionar seletor de Engine (Toggle `Gemini 2.5 Flash` vs `Claude 3.5 Sonnet`).
   - Botões de 1 clique: `[Copiar Tailwind]`, `[Copiar Prompt Stitch]`, `[Copiar Prompt Figma]`.
5. **Validação:** Rodar `npm run build`.

---

### 🔹 FASE 4: Pessoal (Tesouraria Visual com OCR em Lote & Projeção)
1. **Endpoint `/api/pessoal/ocr-extract/route.ts`:**
   - Recebe imagem (print de extrato bancário do Nubank/Inter/Itaú, fatura de cartão ou foto de cupom fiscal).
   - Envia para `google/gemini-2.5-flash` multimodal com o prompt:
     > *"Analise este print financeiro. Extraia todas as transações identificadas com data, descrição, valor numérico positivo, categoria e tipo (ENTRADA, SAIDA_PAGA, SAIDA_PENDENTE). Retorne estritamente JSON { transacoes: [...] }."*
2. **Componente `src/components/pessoal/bulk-ocr-modal.tsx`:**
   - Modal acionado após upload do print.
   - Lista todas as transações detectadas em formato de tabela mobile com checkbox ao lado de cada uma.
   - Botão **"Selecionar Todos" / "Desmarcar Todos"**.
   - Permite editar valor ou categoria de qualquer item antes de salvar.
   - Botão principal: **"Gravar [N] Transações no Extrato"** (insere todos os selecionados no Supabase de uma só vez).
3. **Card de Previsão de Fechamento do Mês:**
   - Na visão Pessoal, abaixo dos KPIs, exibir cálculo dinâmico:
     - `Saldo Atual` - `Faturas a Vencer` + `Entradas Previstas` = **`Previsão de Fechamento de Mês`**.
     - Alerta visual verde se saldo positivo, ou vermelho se projetar déficit.
4. **Validação:** Rodar `npm run build`.

---

### 🔹 FASE 5: PW Labs (Inbound Webhooks & Disparo de E-mails via Resend)
1. **Webhook Público `/api/webhooks/pwlabs-lead/route.ts`:**
   - Rota POST pública (sem exigência de cookie/auth).
   - Payload esperado: `{ nome, email, telefone, empresa, mensagem, servico_interesse }`.
   - Cria automaticamente um registro na tabela `crm_deals` com:
     - `user_id`: ID do proprietário da conta (busca primeiro usuário ou do admin).
     - `workspace_id`: `'pwlabs'`.
     - `estagio`: `'PROSPECCAO'`.
     - `titulo_deal`: `empresa || nome`.
     - `notas`: `Mensagem recebida via site: ${mensagem}`.
   - Responde com CORS liberado e status 200 `{ success: true, deal_id }`.
2. **Endpoint `/api/pwlabs/send-campaign/route.ts`:**
   - Usa `RESEND_API_KEY` do ambiente.
   - Recebe `campanha_id`, `assunto`, `conteudo_html` e lista de destinatários.
   - Dispara os e-mails e atualiza a tabela `pwlabs_campanhas` com status `'CONCLUIDO'`.
3. **Gerador de Copy de E-mail B2B:**
   - Na aba de marketing da PW Labs, adicionar campo onde a IA gera e-mails frios ou follow-ups com 1 clique usando Gemini 2.5 Flash.
4. **Validação Final:** Rodar `npm run build` e certificar-se de 0 erros.

---

## 💻 5. COMANDOS DE COMMIT GIT ATÔMICOS

Execute os commits no terminal exatamente após a conclusão de cada fase:

```bash
# Fase 1:
git add .
git commit -m "feat(core): update schemas, types and install resend for multi-workspace"

# Fase 2:
git add .
git commit -m "feat(gstore): add arbitrage flip calculations, price anchoring and affiliate social copies"

# Fase 3:
git add .
git commit -m "feat(acto): add design mobile console with print capture, engine selector and stitch/figma prompts"

# Fase 4:
git add .
git commit -m "feat(pessoal): add multimodal OCR for bank statements with bulk triage modal and cashflow forecast"

# Fase 5:
git add .
git commit -m "feat(pwlabs): add public inbound lead webhook and Resend email marketing campaign engine"
```

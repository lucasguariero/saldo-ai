# 💰 ESPECIFICAÇÃO DE EXECUÇÃO — TESOURARIA PESSOAL & REEMBOLSO G-STORE
> **Instrução para Claude Code:** Execute este playbook de forma estritamente atômica. Implemente cada um dos passos descritos abaixo para integrar a tesouraria visual estilo Copilot Money, separação de despesas de flips da G-Store no cartão pessoal com reembolso, e a projeção dinâmica de fechamento de mês. Valide com `npm run build` e comite ao final.

---

## 📂 1. ARQUIVOS A MODIFICAR E CRIAR

1. `src/types/finance.ts` — [MODIFICAR] Adicionar campos de reembolso G-Store em `Transacao` e `ResumoFinanceiro`.
2. `src/types/crm.ts` — [MODIFICAR] Adicionar `is_reembolso_gstore` na interface `OCRTransacaoExtraida`.
3. `src/components/pessoal/reembolso-card.tsx` — [NOVO] Card de conciliação de compras da G-Store passadas no cartão pessoal (com botão de 1 clique para liquidar reembolso).
4. `src/components/pessoal/cashflow-forecast-card.tsx` — [NOVO] Card de projeção dinâmica de fluxo de caixa estilo Copilot Money para o fechamento do mês.
5. `src/components/pessoal/bulk-ocr-modal.tsx` — [MODIFICAR] Adicionar seletor de destino por linha (`[👤 Pessoal]` vs `[🛍️ Reembolso G-Store]`) e somatório segmentado no rodapé.
6. `src/components/dashboard/dashboard-view.tsx` — [MODIFICAR] Integrar os novos cards na aba Pessoal com alinhamento horizontal uniforme.

---

## 📝 2. CONTRATOS DE TIPOS

### Atualizar `src/types/finance.ts`:
Adicione os campos de reembolso:

```typescript
export interface Transacao {
  id: string;
  created_at: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  forma_pagamento: FormaPagamento;
  observacao?: string | null;
  data_transacao: string; // YYYY-MM-DD
  data_vencimento?: string | null; // YYYY-MM-DD
  user_id?: string | null;
  // Conciliação de compras corporativas da G-Store no cartão pessoal
  is_reembolso_gstore?: boolean;
  reembolso_status?: 'PENDENTE' | 'REEMBOLSADO' | null;
  reembolso_data?: string | null;
}
```

### Atualizar `src/types/crm.ts`:
No tipo `OCRTransacaoExtraida`:
```typescript
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
  is_reembolso_gstore?: boolean;
}
```

---

## 🛠️ 3. PASSO A PASSO DA IMPLEMENTAÇÃO

### Passo 1: Criar o Card de Reembolso G-Store (`src/components/pessoal/reembolso-card.tsx`)
Crie o componente que audita os gastos da G-Store no cartão pessoal:

```tsx
'use client';

import React, { useState } from 'react';
import { ShoppingBag, ArrowRightLeft, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Transacao } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import { createClient } from '@/lib/supabase/client';

interface ReembolsoCardProps {
  transacoes: Transacao[];
  onReembolsoAtualizado: () => void;
}

export function ReembolsoCard({ transacoes, onReembolsoAtualizado }: ReembolsoCardProps) {
  const supabase = createClient();
  const [expandido, setExpandido] = useState(false);
  const [liquidando, setLiquidando] = useState(false);

  // Transações de compras da loja passadas no cartão pessoal que aguardam reembolso
  const pendentesReembolso = transacoes.filter(
    (t) => t.is_reembolso_gstore && t.reembolso_status !== 'REEMBOLSADO'
  );

  const totalPendente = pendentesReembolso.reduce((sum, t) => sum + Number(t.valor), 0);

  if (pendentesReembolso.length === 0) {
    return null; // Oculta o card se não houver pendências de reembolso da G-Store
  }

  const handleQuitarTodos = async () => {
    if (!supabase || pendentesReembolso.length === 0) return;
    setLiquidando(true);
    try {
      const ids = pendentesReembolso.map((t) => t.id);
      const { error } = await supabase
        .from('transacoes')
        .update({
          reembolso_status: 'REEMBOLSADO',
          reembolso_data: new Date().toISOString(),
        })
        .in('id', ids);

      if (!error) {
        onReembolsoAtualizado();
      }
    } catch (e) {
      console.error('Erro ao quitar reembolsos:', e);
    } finally {
      setLiquidando(false);
    }
  };

  return (
    <Card className="border-purple-500/30 bg-purple-500/5 overflow-hidden shadow-xs">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  Conciliação G-Store
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Compras no Cartão Pessoal
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total a reembolsar pela loja para sua conta física: <strong className="text-purple-600 dark:text-purple-400 font-bold">{formatCurrency(totalPendente)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpandido(!expandido)}
              className="h-8 text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            >
              <span>{pendentesReembolso.length} itens</span>
              {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="sm"
              onClick={handleQuitarTodos}
              disabled={liquidando}
              className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
            >
              {liquidando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>Marcar como Reembolsado</span>
            </Button>
          </div>
        </div>

        {expandido && (
          <div className="pt-2 border-t border-purple-500/20 space-y-1.5 animate-in fade-in duration-150">
            {pendentesReembolso.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-background/60 border border-purple-500/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-[11px] font-mono">{t.data_transacao}</span>
                  <span className="font-medium text-foreground truncate max-w-xs">{t.descricao}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.categoria}</Badge>
                </div>
                <span className="font-bold text-foreground shrink-0">{formatCurrency(t.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Passo 2: Criar o Card de Projeção de Fluxo de Caixa (`src/components/pessoal/cashflow-forecast-card.tsx`)
Crie o card de projeção de fechamento estilo Copilot Money:

```tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ResumoFinanceiro, Transacao } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface CashflowForecastCardProps {
  resumo: ResumoFinanceiro;
  transacoesDoMes: Transacao[];
  currentDate: Date;
}

export function CashflowForecastCard({ resumo, transacoesDoMes, currentDate }: CashflowForecastCardProps) {
  // Contas pendentes a pagar neste mês
  const contasPendentes = transacoesDoMes.filter((t) => t.tipo === 'SAIDA_PENDENTE');
  const totalContasPendentes = contasPendentes.reduce((sum, t) => sum + Number(t.valor), 0);

  // Total de reembolsos da G-Store a receber
  const reembolsosAReceber = transacoesDoMes
    .filter((t) => t.is_reembolso_gstore && t.reembolso_status !== 'REEMBOLSADO')
    .reduce((sum, t) => sum + Number(t.valor), 0);

  // Saldo projetado no fechamento: Saldo Atual - Contas a Pagar + Reembolsos
  const saldoFechamentoProjetado = resumo.saldoAtual - totalContasPendentes + reembolsosAReceber;
  const isPositivo = saldoFechamentoProjetado >= 0;

  const nomeMes = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Card className={`border shadow-xs overflow-hidden ${
      isPositivo 
        ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-card' 
        : 'border-rose-500/20 bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-card'
    }`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
              isPositivo ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {isPositivo ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                  isPositivo ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  Previsão Copilot
                </span>
                <span className="text-xs font-semibold text-foreground capitalize">
                  Fechamento de {nomeMes}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Projeção estimada considerando faturas em aberto e reembolsos
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block uppercase font-mono tracking-wider">Saldo Final Projetado</span>
            <span className={`text-xl font-bold tracking-tight ${
              isPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(saldoFechamentoProjetado)}
            </span>
          </div>
        </div>

        {/* Breakdown de Indicadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs">
          <div className="p-2 rounded-lg bg-background/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Saldo Atual em Conta</span>
            <span className="font-bold text-foreground">{formatCurrency(resumo.saldoAtual)}</span>
          </div>

          <div className="p-2 rounded-lg bg-background/50 border border-border/30">
            <span className="text-[10px] text-rose-500 block font-medium">(-) Faturas a Vencer</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(totalContasPendentes)}</span>
          </div>

          <div className="p-2 rounded-lg bg-background/50 border border-border/30">
            <span className="text-[10px] text-purple-500 block font-medium">(+) Reembolso G-Store</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">+{formatCurrency(reembolsosAReceber)}</span>
          </div>

          <div className="p-2 rounded-lg bg-background/50 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Status Financeiro</span>
            <span className={`font-bold ${isPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositivo ? 'Superávit Seguro' : 'Alerta de Déficit'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Passo 3: Atualizar o Modal de OCR em Lote (`src/components/pessoal/bulk-ocr-modal.tsx`)
No arquivo `src/components/pessoal/bulk-ocr-modal.tsx`:
1. Adicione suporte para alternar entre despesa pessoal e compra da G-Store em cada item:
```tsx
  const toggleGStoreReembolso = (idTemp: string) => {
    setTransacoes((prev) =>
      prev.map((t) =>
        t.id_temp === idTemp
          ? {
              ...t,
              is_reembolso_gstore: !t.is_reembolso_gstore,
              categoria: !t.is_reembolso_gstore ? 'Estoque G-Store' : t.categoria,
            }
          : t
      )
    );
  };
```
2. Na renderização de cada item da lista (dentro do `.map((t) => ...)`):
Adicione um botão seletor de tag:
```tsx
<button
  type="button"
  onClick={() => toggleGStoreReembolso(t.id_temp)}
  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
    t.is_reembolso_gstore
      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40'
      : 'bg-muted text-muted-foreground border-border/40 hover:text-foreground'
  }`}
  title="Alternar entre despesa pessoal e compra da G-Store para reembolso"
>
  {t.is_reembolso_gstore ? '🛍️ G-Store (Reembolsar)' : '👤 Pessoal'}
</button>
```
3. Ao gravar as transações no Supabase (`salvarTransacoes`), inclua os campos no payload:
```tsx
  is_reembolso_gstore: t.is_reembolso_gstore || false,
  reembolso_status: t.is_reembolso_gstore ? 'PENDENTE' : null,
```
4. No rodapé do modal, exiba o resumo dividido:
```tsx
  <div className="flex items-center gap-3 text-xs text-muted-foreground">
    <span>Total Pessoal: <strong className="text-foreground">{formatCurrency(totalPessoal)}</strong></span>
    <span>•</span>
    <span>Reembolso G-Store: <strong className="text-purple-600 dark:text-purple-400">{formatCurrency(totalGStore)}</strong></span>
  </div>
```

---

### Passo 4: Conectar os Cards no `src/components/dashboard/dashboard-view.tsx`
1. Importe os novos componentes:
```tsx
import { ReembolsoCard } from '@/components/pessoal/reembolso-card';
import { CashflowForecastCard } from '@/components/pessoal/cashflow-forecast-card';
```
2. Dentro do bloco `{workspace === 'pessoal' && ( ... )}`:
Logo após o `<MonthSelector ... />`, renderize os cards com alinhamento horizontal impecável:

```tsx
  {workspace === 'pessoal' && (
    <>
      <MonthSelector currentDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Card de Previsão de Fechamento de Mês (Copilot Money) */}
      <CashflowForecastCard
        resumo={resumo}
        transacoesDoMes={transacoesDoMes}
        currentDate={selectedDate}
      />

      {/* Card de Conciliação de Compras da G-Store no Cartão Pessoal */}
      <ReembolsoCard
        transacoes={transacoes}
        onReembolsoAtualizado={fetchTransacoes}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Resto do dashboard mantido idêntico */}
        ...
```

---

## ⚡ 4. VALIDAÇÃO & COMMIT
Execute no terminal:
```bash
npm run build
git add .
git commit -m "feat(pessoal): add G-Store card reimbursement reconciliation, Copilot cashflow forecast and bulk OCR tagging"
git push origin main
```

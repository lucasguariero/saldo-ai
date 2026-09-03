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

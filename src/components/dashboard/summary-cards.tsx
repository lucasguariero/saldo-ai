'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Wallet } from 'lucide-react';
import { MetricCard } from './metric-card';
import { ResumoFinanceiro } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';

interface SummaryCardsProps {
  resumo: ResumoFinanceiro;
}

export function SummaryCards({ resumo }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Entradas */}
      <MetricCard
        title="Entradas do Mês"
        value={formatCurrency(resumo.totalEntradas)}
        subtitle="Recebimentos & PIX confirmados"
        icon={ArrowDownLeft}
        variant="emerald"
      />

      {/* 2. Saídas Pagas */}
      <MetricCard
        title="Saídas Pagas"
        value={formatCurrency(resumo.totalSaidasPagas)}
        subtitle="Débito, PIX e Dinheiro liquidados"
        icon={ArrowUpRight}
        variant="rose"
      />

      {/* 3. Saídas Pendentes */}
      <MetricCard
        title="Contas a Vencer / Faturas"
        value={formatCurrency(resumo.totalSaidasPendentes)}
        subtitle="Faturas de cartão e contas pendentes"
        icon={Clock}
        variant="amber"
      />

      {/* 4. Saldo Atual & Projetado */}
      <MetricCard
        title="Saldo em Caixa"
        value={formatCurrency(resumo.saldoAtual)}
        subtitle={`Projetado após pendentes: ${formatCurrency(resumo.saldoProjetado)}`}
        icon={Wallet}
        variant={resumo.saldoAtual >= 0 ? 'indigo' : 'rose'}
      />
    </div>
  );
}

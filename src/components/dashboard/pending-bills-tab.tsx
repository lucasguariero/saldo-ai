'use client';

import React, { useState, useMemo } from 'react';
import { Transacao, NovaTransacaoInput } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface PendingBillsTabProps {
  transacoes: Transacao[];
  onMarkAsPaid: (transacao: Transacao, formaPagamento: string, dataPagamento: string) => void;
  selectedMonth: Date;
}

export function PendingBillsTab({ transacoes, onMarkAsPaid, selectedMonth }: PendingBillsTabProps) {
  const [payingBill, setPayingBill] = useState<Transacao | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);

  // Filtrar apenas transações pendentes do mês selecionado
  const pendencias = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transacoes.filter((t) => {
      if (t.tipo !== 'SAIDA_PENDENTE') return false;
      if (!t.data_vencimento) return false;

      // Verifica se é do mês selecionado
      const vencDate = new Date(t.data_vencimento);
      const selectedYear = selectedMonth.getFullYear();
      const selectedMonthNum = selectedMonth.getMonth();

      return vencDate.getFullYear() === selectedYear && vencDate.getMonth() === selectedMonthNum;
    });
  }, [transacoes, selectedMonth]);

  // Métricas
  const metricas = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalVencidas = 0;
    let totalProximas = 0;
    let totalOutros = 0;

    pendencias.forEach((p) => {
      const vencDate = new Date(p.data_vencimento!);
      vencDate.setHours(0, 0, 0, 0);

      const diffTime = vencDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        totalVencidas += Number(p.valor);
      } else if (diffDays <= 7) {
        totalProximas += Number(p.valor);
      } else {
        totalOutros += Number(p.valor);
      }
    });

    return {
      totalVencidas,
      totalProximas,
      totalOutros,
      totalGeral: totalVencidas + totalProximas + totalOutros,
    };
  }, [pendencias]);

  const handleConfirmPayment = (transacao: Transacao) => {
    onMarkAsPaid(transacao, formaPagamento, dataPagamento);
    setPayingBill(null);
    setFormaPagamento('PIX');
    setDataPagamento(new Date().toISOString().split('T')[0]);
  };

  const getStatusBadge = (dataVencimento: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vencDate = new Date(dataVencimento);
    vencDate.setHours(0, 0, 0, 0);

    const diffTime = vencDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3" />,
        text: `Vencida há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`,
      };
    } else if (diffDays === 0) {
      return {
        variant: 'destructive' as const,
        icon: <Clock className="h-3 w-3" />,
        text: 'Vence hoje',
      };
    } else if (diffDays <= 5) {
      return {
        variant: 'destructive' as const,
        icon: <Clock className="h-3 w-3" />,
        text: `Vence em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`,
      };
    } else {
      return {
        variant: 'secondary' as const,
        icon: <Calendar className="h-3 w-3" />,
        text: formatDate(dataVencimento).slice(0, 5),
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Vencidas */}
        <Card className={metricas.totalVencidas > 0 ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(metricas.totalVencidas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendencias.filter(p => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const v = new Date(p.data_vencimento!);
                v.setHours(0, 0, 0, 0);
                return v < today;
              }).length} conta(s)
            </p>
          </CardContent>
        </Card>

        {/* Total Próximas (7 dias) */}
        <Card className={metricas.totalProximas > 0 ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Vencem em 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(metricas.totalProximas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendencias.filter(p => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const v = new Date(p.data_vencimento!);
                v.setHours(0, 0, 0, 0);
                const diff = Math.ceil((v.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return diff >= 0 && diff <= 7;
              }).length} conta(s)
            </p>
          </CardContent>
        </Card>

        {/* Total Geral */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metricas.totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendencias.length} pendência(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pendências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Faturas e Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendencias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="font-medium">Nenhuma conta pendente!</p>
              <p className="text-sm">Todas as contas foram quitadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendencias.map((pendencia) => {
                const status = getStatusBadge(pendencia.data_vencimento!);
                return (
                  <div
                    key={pendencia.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{pendencia.descricao}</span>
                        <Badge variant={status.variant} className="flex items-center gap-1 text-xs">
                          {status.icon}
                          {status.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {pendencia.categoria}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(Number(pendencia.valor))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => setPayingBill(pendencia)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Pagamento */}
      {payingBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Confirmar Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium">{payingBill.descricao}</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">
                  {formatCurrency(Number(payingBill.valor))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Vencimento: {formatDate(payingBill.data_vencimento!)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="PIX">PIX</option>
                  <option value="DEBITO">Cartão de Débito</option>
                  <option value="CREDITO">Cartão de Crédito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data do Pagamento</label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPayingBill(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleConfirmPayment(payingBill)}
                >
                  Confirmar Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

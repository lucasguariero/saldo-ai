'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transacao, NovaTransacaoInput, ResumoFinanceiro, CategoriaGasto, FluxoDia } from '@/types/finance';
import { createClient } from '@/lib/supabase/client';
import { Header } from './header';
import { SummaryCards } from './summary-cards';
import { TransactionTable } from './transaction-table';
import { TransactionModal } from './transaction-modal';
import { CategoryBreakdown } from './category-breakdown';
import { CashFlowChart } from './cash-flow-chart';
import { VoiceCommandBar } from './voice-command-bar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, ListOrdered } from 'lucide-react';
import { MOCK_TRANSACOES } from '@/lib/mock-data';

interface DashboardViewProps {
  initialTransacoes?: Transacao[];
}

export function DashboardView({ initialTransacoes = [] }: DashboardViewProps) {
  const [transacoes, setTransacoes] = useState<Transacao[]>(
    initialTransacoes.length > 0 ? initialTransacoes : MOCK_TRANSACOES
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const supabase = useMemo(() => {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return createClient();
      }
    } catch (e) {
      console.warn('Supabase credentials not configured yet, using local state mode.', e);
    }
    return null;
  }, []);

  // Fetch initial data if Supabase is connected
  useEffect(() => {
    if (!supabase) return;

    async function loadData() {
      try {
        const { data, error } = await supabase!
          .from('transacoes')
          .select('*')
          .order('data_transacao', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setTransacoes(data as Transacao[]);
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase (maybe table is empty or credentials pending). Using initial data.', err);
      }
    }

    loadData();

    // Supabase Realtime Subscription
    try {
      const channel = supabase
        .channel('transacoes-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transacoes' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTransacao = payload.new as Transacao;
              setTransacoes((prev) => [newTransacao, ...prev.filter((t) => t.id !== newTransacao.id)]);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Transacao;
              setTransacoes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any).id;
              setTransacoes((prev) => prev.filter((t) => t.id !== deletedId));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          } else {
            setIsRealtimeConnected(false);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }
  }, [supabase]);

  // Cálculos de Resumo Financeiro
  const resumo: ResumoFinanceiro = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidasPagas = 0;
    let totalSaidasPendentes = 0;

    transacoes.forEach((t) => {
      const val = Number(t.valor) || 0;
      if (t.tipo === 'ENTRADA') {
        totalEntradas += val;
      } else if (t.tipo === 'SAIDA_PAGA') {
        totalSaidasPagas += val;
      } else if (t.tipo === 'SAIDA_PENDENTE') {
        totalSaidasPendentes += val;
      }
    });

    const saldoAtual = totalEntradas - totalSaidasPagas;
    const saldoProjetado = totalEntradas - (totalSaidasPagas + totalSaidasPendentes);

    return {
      totalEntradas,
      totalSaidasPagas,
      totalSaidasPendentes,
      saldoAtual,
      saldoProjetado,
      quantidadeTransacoes: transacoes.length,
    };
  }, [transacoes]);

  // Gastos por Categoria
  const categoriasGasto: CategoriaGasto[] = useMemo(() => {
    const map = new Map<string, { total: number; quantidade: number }>();
    let totalGasto = 0;

    transacoes
      .filter((t) => t.tipo === 'SAIDA_PAGA' || t.tipo === 'SAIDA_PENDENTE')
      .forEach((t) => {
        const val = Number(t.valor) || 0;
        totalGasto += val;
        const current = map.get(t.categoria) || { total: 0, quantidade: 0 };
        map.set(t.categoria, {
          total: current.total + val,
          quantidade: current.quantidade + 1,
        });
      });

    return Array.from(map.entries())
      .map(([categoria, info]) => ({
        categoria,
        total: info.total,
        quantidade: info.quantidade,
        porcentagem: totalGasto > 0 ? (info.total / totalGasto) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transacoes]);

  // Fluxo diário para o gráfico
  const fluxoDiario: FluxoDia[] = useMemo(() => {
    const map = new Map<string, { entradas: number; saidasPagas: number; saidasPendentes: number }>();

    // Ordena do mais antigo para o mais recente para o gráfico
    const sorted = [...transacoes].sort((a, b) => a.data_transacao.localeCompare(b.data_transacao));

    sorted.forEach((t) => {
      const data = t.data_transacao;
      const current = map.get(data) || { entradas: 0, saidasPagas: 0, saidasPendentes: 0 };
      const val = Number(t.valor) || 0;

      if (t.tipo === 'ENTRADA') current.entradas += val;
      else if (t.tipo === 'SAIDA_PAGA') current.saidasPagas += val;
      else if (t.tipo === 'SAIDA_PENDENTE') current.saidasPendentes += val;

      map.set(data, current);
    });

    return Array.from(map.entries()).map(([data, values]) => {
      const parts = data.split('-');
      const dataLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : data;
      return {
        data,
        dataLabel,
        ...values,
      };
    });
  }, [transacoes]);

  // Handlers CRUD
  const handleSaveTransaction = async (data: NovaTransacaoInput, id?: string) => {
    if (supabase) {
      try {
        if (id) {
          const { error } = await supabase.from('transacoes').update(data as any).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('transacoes').insert([data as any]);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase operation failed, updating state locally:', err);
      }
    }

    // Atualiza estado local
    if (id) {
      setTransacoes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    } else {
      const nova: Transacao = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setTransacoes((prev) => [nova, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (supabase) {
      try {
        await supabase.from('transacoes').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete failed, removing locally:', err);
      }
    }
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkAsPaid = async (transacao: Transacao) => {
    const updatedData = { tipo: 'SAIDA_PAGA' as const, data_vencimento: null };
    if (supabase) {
      try {
        await supabase.from('transacoes').update(updatedData as any).eq('id', transacao.id);
      } catch (err) {
        console.error('Supabase update failed:', err);
      }
    }
    setTransacoes((prev) =>
      prev.map((t) => (t.id === transacao.id ? { ...t, ...updatedData } : t))
    );
  };

  const handleOpenEdit = (transacao: Transacao) => {
    setEditingTransaction(transacao);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleVoiceTransactionAdded = (novas: Transacao[]) => {
    setTransacoes((prev) => {
      const novosIds = new Set(novas.map((n) => n.id));
      const filtradas = prev.filter((p) => !novosIds.has(p.id));
      return [...novas, ...filtradas];
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-emerald-500/20">
      <Header
        onOpenNewTransaction={handleOpenNew}
        isRealtimeConnected={isRealtimeConnected}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl">
        {/* Barra de Comando de Voz e IA */}
        <VoiceCommandBar onTransactionAdded={handleVoiceTransactionAdded} />

        {/* KPI Cards de Resumo */}
        <SummaryCards resumo={resumo} />

        {/* Linha de Gráficos e Categorias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowChart dados={fluxoDiario} />
          </div>
          <div className="lg:col-span-1">
            <CategoryBreakdown categorias={categoriasGasto} />
          </div>
        </div>

        {/* Tabela de Transações */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ListOrdered className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Extrato de Transações</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </CardHeader>
          <CardContent>
            <TransactionTable
              transacoes={transacoes}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTransaction}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        Kora &bull; Sistema Pessoal de Gestão Financeira Inteligente
      </footer>

      {/* Modal de Adicionar / Editar */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
    </div>
  );
}

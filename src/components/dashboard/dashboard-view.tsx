'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transacao, NovaTransacaoInput, ResumoFinanceiro, CategoriaGasto, FluxoDia } from '@/types/finance';
import { Workspace } from '@/types/crm';
import { WorkspaceId, WORKSPACE_STORAGE_KEY } from '@/types/workspace';
import { createClient } from '@/lib/supabase/client';
import { Header } from './header';
import { SummaryCards } from './summary-cards';
import { TransactionTable } from './transaction-table';
import { TransactionModal } from './transaction-modal';
import { CategoryBreakdown } from './category-breakdown';
import { CashFlowChart } from './cash-flow-chart';
import { VoiceCommandBar } from './voice-command-bar';
import { MonthSelector } from './month-selector';
import { PendingBillsTab } from './pending-bills-tab';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { GStoreView } from '@/components/gstore/gstore-view';
import { DealsKanban } from '@/components/pwlabs/deals-kanban';
import { ActoView } from '@/components/acto/acto-view';
import { DailyBriefingCard } from './daily-briefing-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, ListOrdered, Loader2 } from 'lucide-react';
import { MOCK_TRANSACOES } from '@/lib/mock-data';

interface DashboardViewProps {
  initialTransacoes?: Transacao[];
}

export function DashboardView({ initialTransacoes = [] }: DashboardViewProps) {
  const [transacoes, setTransacoes] = useState<Transacao[]>(
    initialTransacoes.length > 0 ? initialTransacoes : MOCK_TRANSACOES
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userId, setUserId] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceId>('pessoal');
  const [workspaceContadores, setWorkspaceContadores] = useState({ gstore: 0, pwlabs: 0, acto: 0, pessoal: 0 });

  // Carregar workspace do localStorage ao iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved && ['gstore', 'pwlabs', 'acto', 'pessoal'].includes(saved)) {
        setWorkspace(saved as WorkspaceId);
      }
    }
  }, []);

  // Initialize Supabase client on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setSupabase(createClient());
      }
    } catch (e) {
      console.warn('Supabase credentials not configured yet, using local state mode.', e);
    }
  }, []);

  // Get current user and fetch data
  useEffect(() => {
    if (!supabase) {
      // Even if supabase is not initialized, allow the UI to render with mock data
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // If no user, use mock data
      if (!user) {
        return;
      }

      // Fetch transactions for this user
      try {
        const { data, error } = await supabase
          .from('transacoes')
          .select('*')
          .eq('user_id', user.id)
          .order('data_transacao', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setTransacoes(data as Transacao[]);
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase:', err);
      }

      // Subscribe to realtime changes with unique user channel
      channel = supabase
        .channel(`transacoes-user-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transacoes' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newTransacao = payload.new as Transacao;
              if (newTransacao.user_id === user.id) {
                setTransacoes((prev) => [newTransacao, ...prev.filter((t) => t.id !== newTransacao.id)]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Transacao;
              if (updated.user_id === user.id) {
                setTransacoes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any).id;
              setTransacoes((prev) => prev.filter((t) => t.id !== deletedId));
            }
          }
        )
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });
    }

    init();

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // Filtrar transações do mês selecionado
  const transacoesDoMes = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    return transacoes.filter((t) => {
      const dataStr = t.data_transacao ? t.data_transacao.split('T')[0] : '';
      if (!dataStr) return false;
      const parts = dataStr.split('-');
      if (parts.length < 2) return false;
      const tYear = parseInt(parts[0], 10);
      const tMonth = parseInt(parts[1], 10) - 1;
      return tYear === year && tMonth === month;
    });
  }, [transacoes, selectedDate]);

  // Cálculos de Resumo Financeiro
  const resumo: ResumoFinanceiro = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidasPagas = 0;
    let totalSaidasPendentes = 0;

    transacoesDoMes.forEach((t) => {
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
      quantidadeTransacoes: transacoesDoMes.length,
    };
  }, [transacoesDoMes]);

  // Gastos por Categoria
  const categoriasGasto: CategoriaGasto[] = useMemo(() => {
    const map = new Map<string, { total: number; quantidade: number }>();
    let totalGasto = 0;

    transacoesDoMes
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
  }, [transacoesDoMes]);

  // Fluxo diário para o gráfico
  const fluxoDiario: FluxoDia[] = useMemo(() => {
    const map = new Map<string, { entradas: number; saidasPagas: number; saidasPendentes: number }>();

    const sorted = [...transacoesDoMes].sort((a, b) => a.data_transacao.localeCompare(b.data_transacao));

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
  }, [transacoesDoMes]);

  // Handlers CRUD
  const handleSaveTransaction = async (data: NovaTransacaoInput, id?: string) => {
    if (supabase && userId) {
      try {
        if (id) {
          const { error } = await supabase.from('transacoes').update(data as any).eq('id', id).eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('transacoes').insert([{ ...data, user_id: userId } as any]);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase operation failed, updating state locally:', err);
      }
    }

    if (id) {
      setTransacoes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    } else {
      const nova: Transacao = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        user_id: userId || undefined,
      };
      setTransacoes((prev) => [nova, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (supabase && userId) {
      try {
        await supabase.from('transacoes').delete().eq('id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Supabase delete failed, removing locally:', err);
      }
    }
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMarkAsPaid = async (
    transacao: Transacao,
    formaPagamento?: string,
    dataPagamento?: string
  ) => {
    const updatedData = {
      tipo: 'SAIDA_PAGA' as const,
      data_vencimento: null,
      forma_pagamento: (formaPagamento || transacao.forma_pagamento) as Transacao['forma_pagamento'],
      data_transacao: dataPagamento || new Date().toISOString().split('T')[0],
    };
    if (supabase && userId) {
      try {
        await supabase.from('transacoes').update(updatedData as any).eq('id', transacao.id).eq('user_id', userId);
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

  const handleWorkspaceChange = (newWorkspace: WorkspaceId) => {
    setWorkspace(newWorkspace);
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, newWorkspace);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-emerald-500/20">
      <Header
        onOpenNewTransaction={handleOpenNew}
        isRealtimeConnected={isRealtimeConnected}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl pb-28">
        {/* 1. Daily Briefing Card do Jarvis (Visível no topo com o panorama de todos os negócios) */}
        <DailyBriefingCard
          userId={userId || undefined}
          onNavigateWorkspace={handleWorkspaceChange}
        />

        {/* 2. Barra Universal do Jarvis (Visível em TODOS os workspaces!) */}
        <VoiceCommandBar
          onTransactionAdded={handleVoiceTransactionAdded}
          onWorkspaceSwitch={handleWorkspaceChange}
          currentWorkspace={workspace}
        />

        {/* 3. Renderiza conforme o workspace selecionado */}
        {workspace === 'gstore' && (
          userId ? (
            <GStoreView userId={userId} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-emerald-500" /> Carregando estoque da G-Store...
            </div>
          )
        )}

        {workspace === 'pwlabs' && (
          userId ? (
            <DealsKanban userId={userId} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Carregando funil da PW Labs...
            </div>
          )
        )}

        {workspace === 'acto' && (
          userId ? (
            <ActoView userId={userId} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-indigo-500" /> Carregando projetos da Acto...
            </div>
          )
        )}

        {workspace === 'pessoal' && (
          <>
            <MonthSelector currentDate={selectedDate} onDateChange={setSelectedDate} />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview" className="gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Contas a Pagar
                  {transacoesDoMes.filter(t => t.tipo === 'SAIDA_PENDENTE').length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                      {transacoesDoMes.filter(t => t.tipo === 'SAIDA_PENDENTE').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-0">
                <SummaryCards resumo={resumo} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CashFlowChart dados={fluxoDiario} />
                  </div>
                  <div className="lg:col-span-1">
                    <CategoryBreakdown categorias={categoriasGasto} />
                  </div>
                </div>
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
                      {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <TransactionTable
                      transacoes={transacoesDoMes}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteTransaction}
                      onMarkAsPaid={handleMarkAsPaid}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                <PendingBillsTab
                  transacoes={transacoesDoMes}
                  onMarkAsPaid={handleMarkAsPaid}
                  selectedMonth={selectedDate}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        activeWorkspace={workspace}
        onWorkspaceChange={handleWorkspaceChange}
        contadores={workspaceContadores}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        defaultDate={editingTransaction ? undefined : selectedDate.toISOString().split('T')[0]}
      />
    </div>
  );
}

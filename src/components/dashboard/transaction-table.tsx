'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transacao, TipoTransacao, FormaPagamento } from '@/types/finance';
import { formatCurrency, formatDate, getTipoConfig, getFormaPagamentoLabel } from '@/lib/formatters';
import {
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  MessageSquare,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

interface TransactionTableProps {
  transacoes: Transacao[];
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: string) => Promise<void>;
  onMarkAsPaid?: (transacao: Transacao) => Promise<void>;
}

export function TransactionTable({
  transacoes,
  onEdit,
  onDelete,
  onMarkAsPaid,
}: TransactionTableProps) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroForma, setFiltroForma] = useState<string>('TODAS');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtragem
  const transacoesFiltradas = transacoes.filter((t) => {
    const matchesBusca =
      t.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      t.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      (t.observacao && t.observacao.toLowerCase().includes(busca.toLowerCase()));

    const matchesTipo = filtroTipo === 'TODOS' || t.tipo === filtroTipo;
    const matchesForma = filtroForma === 'TODAS' || t.forma_pagamento === filtroForma;

    return matchesBusca && matchesTipo && matchesForma;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta transação?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, observação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs de Tipo */}
          <div className="flex rounded-lg border border-border/70 p-1 bg-secondary/30 text-xs">
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filtroTipo === 'TODOS' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({transacoes.length})
            </button>
            <button
              onClick={() => setFiltroTipo('ENTRADA')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filtroTipo === 'ENTRADA' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFiltroTipo('SAIDA_PAGA')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filtroTipo === 'SAIDA_PAGA' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pagas
            </button>
            <button
              onClick={() => setFiltroTipo('SAIDA_PENDENTE')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filtroTipo === 'SAIDA_PENDENTE' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pendentes
            </button>
          </div>

          {/* Select Forma de Pagamento */}
          <select
            value={filtroForma}
            onChange={(e) => setFiltroForma(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus-visible:outline-none"
          >
            <option value="TODAS" className="bg-popover text-popover-foreground">Forma: Todas</option>
            <option value="PIX" className="bg-popover text-popover-foreground">PIX</option>
            <option value="DEBITO" className="bg-popover text-popover-foreground">Débito</option>
            <option value="CREDITO" className="bg-popover text-popover-foreground">Crédito</option>
            <option value="DINHEIRO" className="bg-popover text-popover-foreground">Dinheiro</option>
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[105px] text-xs font-semibold">Data</TableHead>
              <TableHead className="text-xs font-semibold">Descrição</TableHead>
              <TableHead className="text-xs font-semibold hidden md:table-cell">Categoria</TableHead>
              <TableHead className="text-xs font-semibold hidden sm:table-cell">Forma</TableHead>
              <TableHead className="text-xs font-semibold">Tipo / Status</TableHead>
              <TableHead className="text-xs font-semibold hidden lg:table-cell">Vencimento</TableHead>
              <TableHead className="text-right text-xs font-semibold">Valor</TableHead>
              <TableHead className="w-[90px] text-center text-xs font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma transação encontrada para os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              transacoesFiltradas.map((t) => {
                const tipoConfig = getTipoConfig(t.tipo);
                const isPendente = t.tipo === 'SAIDA_PENDENTE';

                return (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                    {/* Data Transação */}
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {formatDate(t.data_transacao)}
                    </TableCell>

                    {/* Descrição & Observação */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          {t.descricao}
                        </span>
                        {t.observacao && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 inline text-muted-foreground/60 shrink-0" />
                            <span className="truncate max-w-[220px] sm:max-w-xs italic">
                              {t.observacao}
                            </span>
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Categoria */}
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                        {t.categoria}
                      </span>
                    </TableCell>

                    {/* Forma de Pagamento */}
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground font-medium">
                        {getFormaPagamentoLabel(t.forma_pagamento)}
                      </span>
                    </TableCell>

                    {/* Tipo / Status */}
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] font-medium ${tipoConfig.badgeClass}`}>
                        {tipoConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Vencimento (para pendentes) */}
                    <TableCell className="hidden lg:table-cell text-xs">
                      {isPendente && t.data_vencimento ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {formatDate(t.data_vencimento)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </TableCell>

                    {/* Valor */}
                    <TableCell className="text-right font-bold text-xs sm:text-sm">
                      <span className={tipoConfig.textColor}>
                        {tipoConfig.prefix} {formatCurrency(t.valor)}
                      </span>
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Botão rápido para marcar pendente como pago */}
                        {isPendente && onMarkAsPaid && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Marcar como Pago"
                            onClick={() => onMarkAsPaid(t)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Editar"
                          onClick={() => onEdit(t)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Excluir"
                          disabled={deletingId === t.id}
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

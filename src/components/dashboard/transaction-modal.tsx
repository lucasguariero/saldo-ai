'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transacao, NovaTransacaoInput, TipoTransacao, FormaPagamento } from '@/types/finance';
import { Calendar, DollarSign, Tag, FileText, CreditCard } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: NovaTransacaoInput, id?: string) => Promise<void>;
  initialData?: Transacao | null;
}

const CATEGORIAS_SUGERIDAS = [
  'Alimentação',
  'Mercado',
  'Transporte',
  'Moradia',
  'Salário',
  'Vendas / Renda Extra',
  'Lazer',
  'Saúde',
  'Educação',
  'Cartão de Crédito',
  'Assinaturas',
  'Outros',
];

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<TipoTransacao>('SAIDA_PAGA');
  const [categoria, setCategoria] = useState('Alimentação');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [dataTransacao, setDataTransacao] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescricao(initialData.descricao);
      setValor(initialData.valor.toString());
      setTipo(initialData.tipo);
      setCategoria(initialData.categoria);
      setFormaPagamento(initialData.forma_pagamento);
      setDataTransacao(initialData.data_transacao);
      setDataVencimento(initialData.data_vencimento || '');
      setObservacao(initialData.observacao || '');
    } else {
      setDescricao('');
      setValor('');
      setTipo('SAIDA_PAGA');
      setCategoria('Alimentação');
      setFormaPagamento('PIX');
      setDataTransacao(new Date().toISOString().split('T')[0]);
      setDataVencimento('');
      setObservacao('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(numValor) || numValor <= 0 || !descricao.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          descricao: descricao.trim(),
          valor: numValor,
          tipo,
          categoria: categoria.trim() || 'Outros',
          forma_pagamento: formaPagamento,
          data_transacao: dataTransacao,
          data_vencimento: tipo === 'SAIDA_PENDENTE' && dataVencimento ? dataVencimento : null,
          observacao: observacao.trim() || null,
        },
        initialData?.id
      );
      onClose();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {initialData ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adicione ou edite os detalhes do lançamento financeiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tipo de Transação */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipo('ENTRADA')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                tipo === 'ENTRADA'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              + Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo('SAIDA_PAGA')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                tipo === 'SAIDA_PAGA'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              - Saída Paga
            </button>
            <button
              type="button"
              onClick={() => setTipo('SAIDA_PENDENTE')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                tipo === 'SAIDA_PENDENTE'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              ⏳ Pendente
            </button>
          </div>

          {/* Descrição & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> Descrição
              </label>
              <Input
                placeholder="Ex: Burger King ou Salário"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Valor (R$)
              </label>
              <Input
                placeholder="0,00"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Categoria & Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIAS_SUGERIDAS.map((cat) => (
                  <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PIX" className="bg-popover text-popover-foreground">PIX</option>
                <option value="DEBITO" className="bg-popover text-popover-foreground">Cartão de Débito</option>
                <option value="CREDITO" className="bg-popover text-popover-foreground">Cartão de Crédito</option>
                <option value="DINHEIRO" className="bg-popover text-popover-foreground">Dinheiro / Espécie</option>
              </select>
            </div>
          </div>

          {/* Datas: Data da Transação e Data de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Data da Transação
              </label>
              <Input
                type="date"
                value={dataTransacao}
                onChange={(e) => setDataTransacao(e.target.value)}
                required
              />
            </div>

            {tipo === 'SAIDA_PENDENTE' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data de Vencimento
                </label>
                <Input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5 opacity-50">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data de Vencimento (N/A)
                </label>
                <Input type="date" disabled placeholder="Não aplicável" />
              </div>
            )}
          </div>

          {/* Observação / Transcrição de Áudio do Telegram */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Observação / Mensagem Original
            </label>
            <Input
              placeholder="Ex: Bk 47,30 sendo que 19 o Kajan passou"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

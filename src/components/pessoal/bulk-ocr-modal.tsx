'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, Upload, Loader2, CheckSquare, Square, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { OCRTransacaoExtraida } from '@/types/crm';
import { createClient } from '@/lib/supabase/client';

interface BulkOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  workspaceId: string;
}

export function BulkOCRModal({ isOpen, onClose, userId, workspaceId }: BulkOCRModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [transacoes, setTransacoes] = useState<OCRTransacaoExtraida[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Processar imagem
  const processarImagem = async () => {
    if (!imagemBase64) return;

    setProcessando(true);
    try {
      const response = await fetch('/api/pessoal/ocr-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagem_base64: imagemBase64 }),
      });

      const data = await response.json();

      if (data.transacoes && Array.isArray(data.transacoes)) {
        // Adicionar ID único e marcar como selecionado por padrão
        const transacoesComId = data.transacoes.map((t: any, index: number) => ({
          ...t,
          id_temp: t.id_temp || `temp-${Date.now()}-${index}`,
          selecionada: true,
        }));
        setTransacoes(transacoesComId);
      }
    } catch (error) {
      console.error('Erro ao processar OCR:', error);
    } finally {
      setProcessando(false);
    }
  };

  // Selecionar/deselecionar todas
  const toggleTodos = () => {
    const todosSelecionados = transacoes.every(t => t.selecionada);
    setTransacoes(prev => prev.map(t => ({ ...t, selecionada: !todosSelecionados })));
  };

  // Alternar seleção de uma transação
  const toggleTransacao = (id: string) => {
    setTransacoes(prev => prev.map(t =>
      t.id_temp === id ? { ...t, selecionada: !t.selecionada } : t
    ));
  };

  // Atualizar valor de uma transação
  const atualizarValor = (id: string, valor: number) => {
    setTransacoes(prev => prev.map(t =>
      t.id_temp === id ? { ...t, valor } : t
    ));
  };

  // Atualizar categoria de uma transação
  const atualizarCategoria = (id: string, categoria: string) => {
    setTransacoes(prev => prev.map(t =>
      t.id_temp === id ? { ...t, categoria } : t
    ));
  };

  // Remover transação
  const removerTransacao = (id: string) => {
    setTransacoes(prev => prev.filter(t => t.id_temp !== id));
  };

  // Salvar transações no banco
  const salvarTransacoes = async () => {
    const selecionadas = transacoes.filter(t => t.selecionada);
    if (selecionadas.length === 0 || !supabase) return;

    setSalvando(true);
    try {
      const transacoesParaSalvar = selecionadas.map(t => ({
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo,
        categoria: t.categoria,
        forma_pagamento: (t.forma_pagamento === 'BOLETO' ? 'DINHEIRO' : t.forma_pagamento) as 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO',
        data_transacao: t.data_transacao,
        data_vencimento: t.data_vencimento || null,
        user_id: userId,
        workspace_id: workspaceId,
      }));

      const { error } = await supabase
        .from('transacoes')
        .insert(transacoesParaSalvar);

      if (error) {
        console.error('Erro ao salvar transações:', error);
        return;
      }

      // Limpar e fechar
      setTransacoes([]);
      setImagemBase64(null);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  };

  // Handle de upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemBase64(reader.result as string);
        setTransacoes([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const transacoesSelecionadas = transacoes.filter(t => t.selecionada);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            OCR em Lote - Extrair Transações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de Imagem */}
          {!imagemBase64 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                id="ocr-upload"
              />
              <label htmlFor="ocr-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para enviar um print de extrato, fatura ou cupom fiscal
                </p>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Imagem
                </Button>
              </label>
            </div>
          )}

          {/* Preview da Imagem */}
          {imagemBase64 && !transacoes.length && !processando && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagemBase64} alt="Preview" className="w-full max-h-64 object-contain" />
                <button
                  onClick={() => { setImagemBase64(null); setTransacoes([]); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={processarImagem} className="w-full gap-2">
                <ImageIcon className="h-4 w-4" />
                Processar OCR
              </Button>
            </div>
          )}

          {/* Processando */}
          {processando && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Extraindo transações com IA...
              </p>
            </div>
          )}

          {/* Lista de Transações */}
          {transacoes.length > 0 && (
            <div className="space-y-3">
              {/* Header com ações em lote */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTodos}
                  className="gap-2"
                >
                  {transacoes.every(t => t.selecionada) ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Selecionar Todos ({transacoesSelecionadas.length}/{transacoes.length})
                </Button>
                <Badge variant="outline">
                  {transacoesSelecionadas.length} selecionadas
                </Badge>
              </div>

              {/* Lista de transações */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transacoes.map((t) => (
                  <div
                    key={t.id_temp}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      t.selecionada ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <button onClick={() => toggleTransacao(t.id_temp)}>
                      {t.selecionada ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <div className="col-span-2">
                        <p className="font-medium truncate">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.data_transacao} • {t.categoria}
                        </p>
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={t.valor}
                          onChange={(e) => atualizarValor(t.id_temp, parseFloat(e.target.value) || 0)}
                          className="h-8 text-right"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={t.tipo === 'ENTRADA' ? 'default' : t.tipo === 'SAIDA_PAGA' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {t.tipo === 'ENTRADA' ? '↑' : '↓'} {t.forma_pagamento}
                        </Badge>
                      </div>
                    </div>

                    <button
                      onClick={() => removerTransacao(t.id_temp)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total e Salvar */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total selecionado</p>
                  <p className="text-xl font-bold">
                    R$ {transacoesSelecionadas.reduce((sum, t) => {
                      return t.tipo === 'ENTRADA' ? sum + t.valor : sum - t.valor;
                    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button
                  onClick={salvarTransacoes}
                  disabled={transacoesSelecionadas.length === 0 || salvando}
                  className="gap-2"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Gravar {transacoesSelecionadas.length} Transações
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

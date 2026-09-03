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
        } as any)
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

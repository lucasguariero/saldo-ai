'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Camera,
  RefreshCw,
  Loader2,
  ExternalLink,
  Package,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProdutoEstoque, StatusProdutoGStore, CanalVenda } from '@/types/crm';

interface GStoreProductCardProps {
  produto: ProdutoEstoque;
  onCopiarAnuncio: (produto: ProdutoEstoque) => void;
  onUploadFoto: (produtoId: string) => void;
  onRefreshBenchmark: (produto: ProdutoEstoque) => void;
  onStatusChange: (produtoId: string, novoStatus: StatusProdutoGStore) => void;
  isRefreshingBenchmark?: boolean;
  isUploadingFoto?: boolean;
  isCopied?: boolean;
}

const CANAIS_DISPONIVEIS: { id: CanalVenda; label: string }[] = [
  { id: 'olx', label: 'OLX' },
  { id: 'facebook', label: 'FB' },
  { id: 'site', label: 'Site' },
  { id: 'instagram', label: 'IG' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function GStoreProductCard({
  produto,
  onCopiarAnuncio,
  onUploadFoto,
  onRefreshBenchmark,
  onStatusChange,
  isRefreshingBenchmark,
  isUploadingFoto,
  isCopied
}: GStoreProductCardProps) {
  const fotoExibicao = produto.foto_capa ||
    (produto.fotos_reais && produto.fotos_reais[0]) ||
    (produto.fotos_referencia && produto.fotos_referencia[0]);

  const custoReal = (produto.custo_bruto || produto.custo_aquisicao || 0) - (produto.cashback || 0);
  const precoVenda = produto.preco_anunciado || produto.preco_teto_mercado || ((produto.custo_bruto || produto.custo_aquisicao || 0) * 1.35);
  const lucroEstimado = precoVenda - custoReal;
  const margemPerc = custoReal > 0 ? Math.round((lucroEstimado / custoReal) * 100) : 0;

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-all bg-card/70 hover:shadow-xs">
      <CardContent className="p-3.5 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
        {/* Miniatura 1:1 com Overlay */}
        <div className="w-full sm:w-28 h-28 rounded-xl bg-muted/40 border border-border/40 shrink-0 overflow-hidden relative group">
          {fotoExibicao ? (
            <img
              src={fotoExibicao}
              alt={produto.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-1">
              <Package className="h-6 w-6" />
              <span className="text-[10px]">Sem foto</span>
            </div>
          )}

          <button
            onClick={() => onUploadFoto(produto.id)}
            disabled={isUploadingFoto}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] gap-1 cursor-pointer"
            title="Tirar foto real"
          >
            {isUploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <span>Tirar Foto</span>
          </button>
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate max-w-sm">
              {produto.titulo}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {produto.condicao}
            </Badge>
          </div>

          {/* Ancoragem de Preço e Lucro */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {produto.preco_varejo_referencia && (
              <span className="line-through text-muted-foreground text-[11px]">
                Novo: {formatCurrency(produto.preco_varejo_referencia)}
              </span>
            )}
            <span className="font-bold text-foreground">
              Venda: {formatCurrency(precoVenda)}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-1.5 py-0.2 rounded">
              +{formatCurrency(lucroEstimado)} ({margemPerc}%)
            </span>
          </div>

          {/* Custo Líquido e Cashback */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Custo Real: <strong className="text-foreground">{formatCurrency(custoReal)}</strong></span>
            {produto.cashback ? (
              <span className="text-green-600 dark:text-green-400">
                (💰 {formatCurrency(produto.cashback)} cashback)
              </span>
            ) : null}
          </div>

          {/* Checkboxes de Canais */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {CANAIS_DISPONIVEIS.map(canal => {
              const ativo = produto.canais_venda?.includes(canal.id);
              return (
                <span
                  key={canal.id}
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    ativo
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/40 text-muted-foreground/50 border-border/30'
                  }`}
                >
                  {canal.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Ações da Direita */}
        <div className="w-full sm:w-auto flex sm:flex-col gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 sm:flex-none h-8 text-xs gap-1.5"
            onClick={() => onCopiarAnuncio(produto)}
          >
            {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            <span>{isCopied ? 'Copiado!' : 'Copy'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="flex-1 sm:flex-none h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => onRefreshBenchmark(produto)}
            disabled={isRefreshingBenchmark}
          >
            {isRefreshingBenchmark ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span>ML</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

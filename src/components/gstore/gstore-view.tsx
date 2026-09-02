'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ProdutoEstoque,
  StatusProdutoGStore,
  GStoreKPIs
} from '@/types/crm';
import { createClient } from '@/lib/supabase/client';

interface GStoreViewProps {
  userId: string;
}

const STATUS_LABELS: Record<StatusProdutoGStore, { label: string; color: string }> = {
  COMPRADO_PREPARACAO: { label: 'Em Preparação', color: 'bg-amber-500' },
  PENDENTE_ANUNCIO: { label: 'Pendente de Anúncio', color: 'bg-red-500' },
  ANUNCIADO: { label: 'Anunciado', color: 'bg-blue-500' },
  VENDIDO: { label: 'Vendido', color: 'bg-emerald-500' },
  DEVOLVIDO: { label: 'Devolvido', color: 'bg-gray-500' },
};

export function GStoreView({ userId }: GStoreViewProps) {
  const supabase = createClient();
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProdutos() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('produtos_estoque')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProdutos(data as ProdutoEstoque[]);
      }
      setLoading(false);
    }

    fetchProdutos();
  }, [userId, supabase]);

  // KPIs
  const kpis = useMemo((): GStoreKPIs => {
    const totalInvestido = produtos
      .filter(p => p.status !== 'VENDIDO')
      .reduce((sum, p) => sum + Number(p.custo_aquisicao), 0);

    const faturamentoProjetado = produtos
      .filter(p => p.status !== 'VENDIDO')
      .reduce((sum, p) => sum + (Number(p.preco_sugerido_max) || 0), 0);

    const lucroBrutoEstimado = faturamentoProjetado - totalInvestido;

    const itensPendentesAnuncio = produtos.filter(
      p => p.status === 'PENDENTE_ANUNCIO'
    ).length;

    return {
      totalInvestido,
      faturamentoProjetado,
      lucroBrutoEstimado,
      itensPendentesAnuncio,
      totalProdutos: produtos.length,
      produtosVendidos: produtos.filter(p => p.status === 'VENDIDO').length,
    };
  }, [produtos]);

  // Produtos por status
  const produtosPorStatus = useMemo(() => {
    const grouped: Record<StatusProdutoGStore, ProdutoEstoque[]> = {
      COMPRADO_PREPARACAO: [],
      PENDENTE_ANUNCIO: [],
      ANUNCIADO: [],
      VENDIDO: [],
      DEVOLVIDO: [],
    };

    produtos.forEach(p => {
      grouped[p.status].push(p);
    });

    return grouped;
  }, [produtos]);

  const copiarAnuncio = async (produto: ProdutoEstoque) => {
    const texto = `${produto.titulo}

${produto.descricao_anuncio || ''}

Preço: R$ ${produto.preco_anunciado?.toFixed(2) || produto.preco_sugerido_max?.toFixed(2) || 'À combinar'}

${produto.especificacoes ? Object.entries(produto.especificacoes)
  .map(([k, v]) => `• ${k}: ${v}`)
  .join('\n') : ''}

Entrego no local!`;

    await navigator.clipboard.writeText(texto);
    setCopiedId(produto.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return <div className="p-8 text-center">Carregando estoque...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Total Investido</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(kpis.totalInvestido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Faturamento Projetado</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(kpis.faturamentoProjetado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Lucro Estimado</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(kpis.lucroBrutoEstimado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">Pendentes de Anúncio</span>
            </div>
            <p className="text-xl font-bold text-red-600">{kpis.itensPendentesAnuncio}</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Status */}
      <Tabs defaultValue="COMPRADO_PREPARACAO">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="COMPRADO_PREPARACAO" className="gap-1">
            <Clock className="h-3 w-3" />
            Preparação
            <Badge variant="secondary" className="ml-1">{produtosPorStatus.COMPRADO_PREPARACAO.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="PENDENTE_ANUNCIO" className="gap-1">
            <Camera className="h-3 w-3" />
            Pendentes
            {kpis.itensPendentesAnuncio > 0 && (
              <Badge variant="destructive" className="ml-1">{kpis.itensPendentesAnuncio}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ANUNCIADO" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Anunciados
            <Badge variant="secondary" className="ml-1">{produtosPorStatus.ANUNCIADO.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="VENDIDO" className="gap-1">
            <DollarSign className="h-3 w-3" />
            Vendidos
            <Badge variant="secondary" className="ml-1">{produtosPorStatus.VENDIDO.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {Object.entries(STATUS_LABELS).map(([status, { label, color }]) => (
          <TabsContent key={status} value={status} className="mt-4">
            {produtosPorStatus[status as StatusProdutoGStore].length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto nesta etapa</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtosPorStatus[status as StatusProdutoGStore].map(produto => (
                  <Card key={produto.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <Badge className={`${color} text-white`}>{label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarAnuncio(produto)}
                          className="h-8 gap-1"
                        >
                          {copiedId === produto.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span className="text-xs">
                            {copiedId === produto.id ? 'Copiado!' : 'Copiar'}
                          </span>
                        </Button>
                      </div>
                      <CardTitle className="text-sm mt-2">{produto.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo:</span>
                        <span className="font-medium">{formatCurrency(produto.custo_aquisicao)}</span>
                      </div>
                      {produto.preco_sugerido_min && produto.preco_sugerido_max && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Venda:</span>
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(produto.preco_sugerido_min)} - {formatCurrency(produto.preco_sugerido_max)}
                          </span>
                        </div>
                      )}
                      {produto.margem_estimada_perc && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Margem:</span>
                          <span className="font-medium">{produto.margem_estimada_perc}%</span>
                        </div>
                      )}
                      {produto.descricao_anuncio && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {produto.descricao_anuncio}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Plus,
  Store,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ProdutoEstoque,
  StatusProdutoGStore,
  GStoreKPIs,
  TipoOperacaoGStore,
  ConcorrenteBenchmark
} from '@/types/crm';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/services/storage';
import { buscarConcorrentesML, calcularPrecos, BenchmarkResultado } from '@/lib/services/mercadolivre';

interface GStoreViewProps {
  userId: string;
}

type ModoGStore = 'estoque' | 'afiliados';

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
  const [modo, setModo] = useState<ModoGStore>('estoque');
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [refreshingBenchmark, setRefreshingBenchmark] = useState<string | null>(null);

  // Refs para os inputs de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProdutos() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('produtos_estoque')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProdutos(data as unknown as ProdutoEstoque[]);
      }
      setLoading(false);
    }

    fetchProdutos();
  }, [userId, supabase]);

  // KPIs
  const kpis = useMemo((): GStoreKPIs => {
    const produtosEstoque = produtos.filter(p => p.tipo_operacao !== 'AFILIADO');
    const totalInvestido = produtosEstoque
      .filter(p => p.status !== 'VENDIDO')
      .reduce((sum, p) => sum + Number(p.custo_aquisicao), 0);

    const faturamentoProjetado = produtosEstoque
      .filter(p => p.status !== 'VENDIDO')
      .reduce((sum, p) => sum + (Number(p.preco_teto_mercado) || Number(p.preco_sugerido_max) || 0), 0);

    const lucroBrutoEstimado = faturamentoProjetado - totalInvestido;

    const itensPendentesAnuncio = produtosEstoque.filter(
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

    const produtosEstoque = produtos.filter(p => p.tipo_operacao !== 'AFILIADO');
    produtosEstoque.forEach(p => {
      grouped[p.status].push(p);
    });

    return grouped;
  }, [produtos]);

  // Produtos de afiliados
  const produtosAfiliados = useMemo(() => {
    return produtos.filter(p => p.tipo_operacao === 'AFILIADO');
  }, [produtos]);

  const copiarAnuncio = async (produto: ProdutoEstoque) => {
    const texto = `${produto.titulo}

${produto.descricao_anuncio || ''}

Preço: R$ ${produto.preco_anunciado?.toFixed(2) || produto.preco_teto_mercado?.toFixed(2) || produto.preco_sugerido_max?.toFixed(2) || 'À combinar'}

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

  // Handler para upload de foto
  const handleUploadPhoto = async (produtoId: string, tipo: 'referencia' | 'real') => {
    setProdutoSelecionado(produtoId);
    setUploadingPhoto(produtoId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !produtoSelecionado || !supabase) {
      setUploadingPhoto(null);
      setProdutoSelecionado(null);
      return;
    }

    try {
      const result = await uploadPhoto(file, userId, produtoSelecionado, 'real');

      if (result.success && result.url) {
        // Atualizar produto com a nova foto
        const produto = produtos.find(p => p.id === produtoSelecionado);
        if (produto) {
          const fotosReais = [...(produto.fotos_reais || []), result.url];
          await supabase
            .from('produtos_estoque')
            .update({ fotos_reais: fotosReais })
            .eq('id', produtoSelecionado);

          setProdutos(prev => prev.map(p =>
            p.id === produtoSelecionado
              ? { ...p, fotos_reais: fotosReais, foto_capa: result.url }
              : p
          ));
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    setUploadingPhoto(null);
    setProdutoSelecionado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Atualizar benchmark de um produto
  const refreshBenchmark = async (produto: ProdutoEstoque) => {
    setRefreshingBenchmark(produto.id);

    try {
      const query = `${produto.marca || ''} ${produto.modelo || produto.titulo}`.trim();
      const condicao = produto.condicao === 'NOVO' ? 'new' : 'used';

      const benchmark = await buscarConcorrentesML(query, condicao);

      if (benchmark && supabase) {
        const precos = calcularPrecos(produto.custo_aquisicao, benchmark);

        await supabase
          .from('produtos_estoque')
          .update({
            benchmark_concorrentes: benchmark.amostraAnuncios as any,
            preco_piso_giro_rapido: precos.precoPisoGiroRapido,
            preco_teto_mercado: precos.precoTetoMercado,
            preco_mediana_mercado: precos.precoMedianaMercado,
            fotos_referencia: benchmark.fotosOficiais,
          })
          .eq('id', produto.id);

        setProdutos(prev => prev.map(p =>
          p.id === produto.id
            ? {
                ...p,
                benchmark_concorrentes: benchmark.amostraAnuncios as any,
                preco_piso_giro_rapido: precos.precoPisoGiroRapido,
                preco_teto_mercado: precos.precoTetoMercado,
                preco_mediana_mercado: precos.precoMedianaMercado,
                fotos_referencia: benchmark.fotosOficiais,
              }
            : p
        ));
      }
    } catch (error) {
      console.error('Benchmark error:', error);
    }

    setRefreshingBenchmark(null);
  };

  // Componente de BenchmarkCard
  const BenchmarkCard = ({ produto }: { produto: ProdutoEstoque }) => {
    const hasBenchmark = produto.preco_mediana_mercado || produto.benchmark_concorrentes?.length;

    if (!hasBenchmark) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => refreshBenchmark(produto)}
          disabled={refreshingBenchmark === produto.id}
        >
          {refreshingBenchmark === produto.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Buscar Benchmark ML
        </Button>
      );
    }

    return (
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Benchmark de Mercado</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Piso (Giro)</p>
            <p className="text-sm font-semibold text-amber-600">
              {formatCurrency(produto.preco_piso_giro_rapido || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">~25% margem</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Mediana</p>
            <p className="text-sm font-semibold text-blue-600">
              {formatCurrency(produto.preco_mediana_mercado || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">~35% margem</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Teto</p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(produto.preco_teto_mercado || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">~50% margem</p>
          </div>
        </div>

        {produto.benchmark_concorrentes && produto.benchmark_concorrentes.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver {produto.benchmark_concorrentes.length} concorrentes
            </summary>
            <div className="mt-2 space-y-1">
              {produto.benchmark_concorrentes.slice(0, 3).map((c, i) => (
                <a
                  key={i}
                  href={c.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-1 bg-background rounded text-muted-foreground hover:text-foreground truncate"
                >
                  {c.titulo.slice(0, 40)}... - {formatCurrency(c.preco)}
                </a>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  // Componente de Carrossel de Fotos
  const PhotoCarousel = ({
    fotos,
    tipo
  }: {
    fotos?: string[];
    tipo: 'referencia' | 'real';
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const allFotos = fotos || [];

    if (allFotos.length === 0) {
      return (
        <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="h-32 bg-muted rounded-lg overflow-hidden">
          <img
            src={allFotos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {allFotos.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(i => (i - 1 + allFotos.length) % allFotos.length)}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % allFotos.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex justify-center gap-1 mt-1">
              {allFotos.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === currentIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>
          </>
        )}

        <span className="absolute top-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
          {tipo === 'referencia' ? '📖 Ref' : '📸 Real'}
        </span>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando estoque...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Modo */}
      <div className="flex gap-2">
        <Button
          variant={modo === 'estoque' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModo('estoque')}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          📦 Estoque / Revenda
        </Button>
        <Button
          variant={modo === 'afiliados' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModo('afiliados')}
          className="gap-2"
        >
          <Store className="h-4 w-4" />
          ⭐ Vitrine Afiliados
        </Button>
      </div>

      {modo === 'estoque' ? (
        <>
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
                  <span className="text-xs">Pendentes</span>
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
                Prep
                <Badge variant="secondary" className="ml-1">{produtosPorStatus.COMPRADO_PREPARACAO.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="PENDENTE_ANUNCIO" className="gap-1">
                <Camera className="h-3 w-3" />
                Pend
                {kpis.itensPendentesAnuncio > 0 && (
                  <Badge variant="destructive" className="ml-1">{kpis.itensPendentesAnuncio}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ANUNCIADO" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Anunc
                <Badge variant="secondary" className="ml-1">{produtosPorStatus.ANUNCIADO.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="VENDIDO" className="gap-1">
                <DollarSign className="h-3 w-3" />
                Vend
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
                          <CardTitle className="text-sm mt-2 line-clamp-2">{produto.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Carrossel de Fotos */}
                          <div className="space-y-1">
                            <PhotoCarousel fotos={produto.fotos_referencia} tipo="referencia" />
                            <PhotoCarousel fotos={produto.fotos_reais} tipo="real" />
                          </div>

                          {/* Botão de upload de foto */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => handleUploadPhoto(produto.id, 'real')}
                            disabled={uploadingPhoto === produto.id}
                          >
                            {uploadingPhoto === produto.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                            📸 Tirar Foto Real
                          </Button>

                          {/* Benchmark */}
                          <BenchmarkCard produto={produto} />

                          {/* Info de preço */}
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Custo:</span>
                            <span className="font-medium">{formatCurrency(produto.custo_aquisicao)}</span>
                          </div>
                          {produto.preco_teto_mercado && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Venda (Teto):</span>
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(produto.preco_teto_mercado)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        // Modo Afiliados
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vitrine de Afiliados</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>

          {produtosAfiliados.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum afiliado ainda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione produtos de lojas parceiras para indicar e ganhar comissão.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Afiliado
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtosAfiliados.map(produto => (
                <Card key={produto.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {produto.foto_capa || produto.fotos_referencia?.[0] ? (
                        <img
                          src={produto.foto_capa || produto.fotos_referencia?.[0]}
                          alt={produto.titulo}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">{produto.titulo}</h3>
                        {produto.loja_afiliada && (
                          <Badge variant="outline" className="text-xs">
                            {produto.loja_afiliada}
                          </Badge>
                        )}
                        {produto.link_afiliado ? (
                          <a
                            href={produto.link_afiliado}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver produto
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full gap-1">
                            <Upload className="h-3 w-3" />
                            Adicionar Link
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input de arquivo oculto para upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

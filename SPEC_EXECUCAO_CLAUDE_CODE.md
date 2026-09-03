# 🎨 ESPECIFICAÇÃO DE REFATORAÇÃO VISUAL & DESIGN SYSTEM (LINEAR / RAYCAST)
> **Instrução para Claude Code:** Execute este playbook de forma estritamente atômica. Implemente cada um dos passos abaixo para eliminar espaço morto, unificar o design system no padrão Linear/Raycast e reestruturar os cards e kanbans. Valide com `npm run build` ao final e comite na branch `main`.

---

## 📂 1. ARQUIVOS ENVOLVIDOS NA REFATORAÇÃO

1. `src/components/dashboard/header.tsx` — [MODIFICAR] Remover logo duplicado no desktop; exibir breadcrumbs do workspace ativo e barra de busca Raycast.
2. `src/components/dashboard/dashboard-view.tsx` — [MODIFICAR] Ajustar container principal para largura fluida e densa (`w-full max-w-7xl mx-auto`).
3. `src/components/gstore/gstore-product-card.tsx` — [NOVO] Card compacto horizontal de produto com miniatura 4:3, ancoragem de preço e ações rápidas.
4. `src/components/gstore/gstore-view.tsx` — [MODIFICAR] Utilizar o `GStoreProductCard` compacto e organizar as tabs de status com badges numéricos.
5. `src/components/pwlabs/deals-kanban.tsx` — [MODIFICAR] Grid 4 colunas responsivo full-width e empty state com linha pontilhada (`border-dashed`).
6. `src/components/acto/acto-view.tsx` — [MODIFICAR] Grid 4 colunas responsivo full-width e empty state com linha pontilhada (`border-dashed`).

---

## 🛠️ 2. PASSO A PASSO DA IMPLEMENTAÇÃO

### Passo 1: Header Limpo sem Duplicação de Branding (`src/components/dashboard/header.tsx`)
Substitua o conteúdo de `src/components/dashboard/header.tsx` pelo código abaixo:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Radio, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  isRealtimeConnected: boolean;
  onOpenCommandPalette?: () => void;
  activeWorkspace?: string;
}

export function Header({ 
  onOpenNewTransaction, 
  isRealtimeConnected, 
  onOpenCommandPalette,
  activeWorkspace = 'pessoal'
}: HeaderProps) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ email: user.email || '' });
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
    router.refresh();
  };

  const getWorkspaceTitle = (ws: string) => {
    switch (ws) {
      case 'gstore': return '🛍️ G-Store (Flip & Estoque)';
      case 'pwlabs': return '🏢 PW Labs (Pipeline & Marketing)';
      case 'acto': return '🎯 Acto (Design & UX)';
      case 'pessoal': return '👤 Pessoal (Tesouraria & Saldo)';
      default: return 'Workspace';
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Mobile Logo (exibido apenas quando a Sidebar Linear está oculta) */}
        <div className="flex md:hidden items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Saldo <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-500 rounded">AI</span></span>
        </div>

        {/* Desktop Breadcrumbs (substitui o logo repetido da Sidebar) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-muted-foreground/60">Workspace</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            {getWorkspaceTitle(activeWorkspace)}
          </span>
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gatilho do Command Palette Raycast */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground border border-border/50 transition-colors cursor-pointer"
              title="Buscar ou abrir comando (⌘K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Comandos...</span>
              <kbd className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
            </button>
          )}

          {/* Status Realtime */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
            <Radio className={`h-2.5 w-2.5 ${isRealtimeConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className="text-[11px] font-medium">{isRealtimeConnected ? 'Online' : 'Offline'}</span>
          </div>

          {/* Usuário e Logout */}
          {user && (
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[140px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

### Passo 2: Layout Fluido no Dashboard (`src/components/dashboard/dashboard-view.tsx`)
Localize a tag `<main>` (linha ~369) e garanta a classe fluida sem margens excessivas:

```tsx
<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 pb-28 md:pb-12">
```

---

### Passo 3: Criar Card Compacto da G-Store (`src/components/gstore/gstore-product-card.tsx`)
Crie o componente de card horizontal de alta densidade:

```tsx
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
import { formatCurrency } from '@/lib/formatters';

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
  const precoVenda = produto.preco_anunciado || produto.preco_teto_mercado || produto.custo_aquisicao * 1.35;
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
```

---

### Passo 4: Atualizar a Listagem da G-Store (`src/components/gstore/gstore-view.tsx`)
1. Importe o `GStoreProductCard`:
```tsx
import { GStoreProductCard } from './gstore-product-card';
```
2. Na renderização da lista de produtos em cada tab, substitua o card anterior pela chamada limpa:
```tsx
<div className="space-y-2.5">
  {produtosPorStatus[status as StatusProdutoGStore].map(produto => (
    <GStoreProductCard
      key={produto.id}
      produto={produto}
      onCopiarAnuncio={copiarAnuncio}
      onUploadFoto={(id) => handleUploadPhoto(id, 'real')}
      onRefreshBenchmark={refreshBenchmark}
      onStatusChange={handleStatusChange}
      isRefreshingBenchmark={refreshingBenchmark === produto.id}
      isUploadingFoto={uploadingPhoto === produto.id}
      isCopied={copiedId === produto.id}
    />
  ))}
</div>
```

---

### Passo 5: Grid Full-Width e Empty States nos Kanbans
1. Em `src/components/pwlabs/deals-kanban.tsx`:
   - No container das colunas do Kanban, garanta `w-full grid grid-cols-1 md:grid-cols-4 gap-4`.
   - Se `dealsPorEstagio[estagio.id].length === 0`, renderize o empty state com linha tracejada:
```tsx
{dealsPorEstagio[estagio.id].length === 0 ? (
  <div className="border border-dashed border-border/60 rounded-xl p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center min-h-[140px]">
    <p>Nenhum lead nesta etapa</p>
  </div>
) : (
  dealsPorEstagio[estagio.id].map(deal => ( ... ))
)}
```

2. Em `src/components/acto/acto-view.tsx`:
   - No container das colunas de demandas, garanta `w-full grid grid-cols-1 md:grid-cols-4 gap-4`.
   - Se `demandasPorStatus[status.id].length === 0`, renderize o empty state com linha tracejada:
```tsx
{demandasPorStatus[status.id].length === 0 ? (
  <div className="border border-dashed border-border/60 rounded-xl p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center min-h-[140px]">
    <p>Nenhuma demanda aqui</p>
  </div>
) : (
  demandasPorStatus[status.id].map(demanda => ( ... ))
)}
```

---

## ⚡ 3. VALIDAÇÃO & COMMIT
Execute no terminal:
```bash
npm run build
git add .
git commit -m "refactor(ui): clean duplicate headers, compact gstore cards and full-width kanbans"
git push origin main
```

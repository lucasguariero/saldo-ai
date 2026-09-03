# 🚀 ESPECIFICAÇÃO DE EXECUÇÃO — SHELL RESPONSIVO & DESIGN SYSTEM
> **Instrução para Claude Code:** Leia este arquivo e execute imediatamente a FASE 1 descrita abaixo. Não faça perguntas nem adie a execução. Implemente os componentes, ajuste os arquivos existentes, valide o build com `npm run build` e faça o commit e push ao final.

---

## 🎯 OBJETIVO DA FASE 1: DESKTOP LINEAR + MOBILE CONTEXTUAL
Atualmente, o `BottomNavBar` de celular está fixo no rodapé no Desktop, prejudicando a ergonomia e densidade da tela.
Nesta fase, implementaremos:
1. **Desktop (>= 768px):** Sidebar colapsável estilo Linear à esquerda, Header limpo com acionamento do Command Palette estilo Raycast (`Cmd+K` / `Ctrl+K`), tela ampla e alta densidade.
2. **Mobile (< 768px):** Sidebar oculta, BottomNavBar ativa exclusiva para o polegar com suporte à Safe Area do iPhone.
3. **Command Palette (`Cmd+K`):** Navegação rápida entre os 4 workspaces e atalhos de ações (Nova Transação, Escanear OCR, etc.).

---

## 📂 ARQUIVOS A CRIAR E MODIFICAR

### 1. [NOVO] `src/components/layout/command-palette.tsx`
Crie o arquivo com o seguinte código:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  Layers, 
  Wallet, 
  Plus, 
  Camera, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { WorkspaceId } from '@/types/workspace';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (id: WorkspaceId) => void;
  onOpenNewTransaction: () => void;
  onOpenOCR: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectWorkspace,
  onOpenNewTransaction,
  onOpenOCR,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      group: 'Navegação de Workspaces',
      items: [
        { id: 'gstore', label: 'Ir para G-Store (Estoque & Afiliados)', icon: ShoppingBag, color: 'text-purple-500', action: () => onSelectWorkspace('gstore') },
        { id: 'pwlabs', label: 'Ir para PW Labs (Pipeline & Marketing)', icon: Briefcase, color: 'text-blue-500', action: () => onSelectWorkspace('pwlabs') },
        { id: 'acto', label: 'Ir para Acto (Design & Front-end)', icon: Layers, color: 'text-orange-500', action: () => onSelectWorkspace('acto') },
        { id: 'pessoal', label: 'Ir para Pessoal (Tesouraria & Saldo)', icon: Wallet, color: 'text-emerald-500', action: () => onSelectWorkspace('pessoal') },
      ]
    },
    {
      group: 'Ações Rápidas',
      items: [
        { id: 'new-tx', label: 'Nova Transação Financeira Manual', icon: Plus, color: 'text-emerald-500', action: onOpenNewTransaction },
        { id: 'ocr-batch', label: 'Escanear Extrato Bancário / Fatura (OCR)', icon: Camera, color: 'text-indigo-500', action: onOpenOCR },
      ]
    }
  ];

  const filteredGroups = actions.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Digite um comando ou busque um workspace... (Esc para fechar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado para &quot;{query}&quot;
            </div>
          ) : (
            filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.group}
                </span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm text-foreground hover:bg-secondary/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground">
          <span>Navegue com o mouse ou atalhos</span>
          <div className="flex items-center gap-1 font-mono">
            <span className="bg-background px-1.5 py-0.5 rounded border border-border">⌘K</span> para abrir
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. [NOVO] `src/components/layout/desktop-sidebar.tsx`
Crie o componente da Sidebar no padrão Linear (colapsável, moderna, minimalista):

```tsx
'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Briefcase, 
  Layers, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Command,
  Plus
} from 'lucide-react';
import { WorkspaceId, WORKSPACE_STORAGE_KEY } from '@/types/workspace';
import { Button } from '@/components/ui/button';

interface DesktopSidebarProps {
  activeWorkspace: WorkspaceId;
  onWorkspaceChange: (id: WorkspaceId) => void;
  onOpenCommandPalette: () => void;
  onOpenNewTransaction: () => void;
}

const workspaces = [
  { id: 'gstore' as WorkspaceId, label: 'G-Store', subtitle: 'Flips & Afiliados', icon: ShoppingBag, color: 'text-purple-500', bgActive: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' },
  { id: 'pwlabs' as WorkspaceId, label: 'PW Labs', subtitle: 'Agência & Inbound', icon: Briefcase, color: 'text-blue-500', bgActive: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' },
  { id: 'acto' as WorkspaceId, label: 'Acto', subtitle: 'Console Design/UI', icon: Layers, color: 'text-orange-500', bgActive: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' },
  { id: 'pessoal' as WorkspaceId, label: 'Pessoal', subtitle: 'Tesouraria & Saldo', icon: Wallet, color: 'text-emerald-500', bgActive: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
];

export function DesktopSidebar({
  activeWorkspace,
  onWorkspaceChange,
  onOpenCommandPalette,
  onOpenNewTransaction
}: DesktopSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (id: WorkspaceId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
    }
    onWorkspaceChange(id);
  };

  return (
    <aside 
      className={`hidden md:flex flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl h-screen sticky top-0 transition-all duration-200 z-40 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Saldo <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-500 rounded">AI</span>
              </span>
              <p className="text-[10px] text-muted-foreground truncate">Operating System</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Search / Command Button */}
      <div className="p-3">
        <button
          onClick={onOpenCommandPalette}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground border border-border/50 transition-all shadow-2xs cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Abrir Command Palette (⌘K)"
        >
          <div className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5" />
            {!collapsed && <span>Comandos...</span>}
          </div>
          {!collapsed && (
            <kbd className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Workspace Navigation List */}
      <div className="flex-1 px-3 space-y-1.5 py-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Workspaces'}
        </span>

        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = activeWorkspace === ws.id;

          return (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                isActive 
                  ? ws.bgActive + ' font-semibold shadow-xs' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? ws.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? '' : ws.color}`} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs">{ws.label}</p>
                  <p className="text-[10px] opacity-70 truncate font-normal">{ws.subtitle}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="p-3 border-t border-border/40">
        <Button
          onClick={onOpenNewTransaction}
          size="sm"
          className={`w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ${
            collapsed ? 'px-0 justify-center' : ''
          }`}
          title="Novo Lançamento"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>Novo Lançamento</span>}
        </Button>
      </div>
    </aside>
  );
}
```

---

### 3. [MODIFICAR] `src/components/layout/bottom-nav-bar.tsx`
No arquivo `src/components/layout/bottom-nav-bar.tsx`, adicione a classe `md:hidden` na tag `<nav>` raiz (linha ~54):

```tsx
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom,16px)] pt-2 px-4"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
```

---

### 4. [MODIFICAR] `src/components/dashboard/header.tsx`
No arquivo `src/components/dashboard/header.tsx`:
1. Atualize a interface `HeaderProps`:
```tsx
interface HeaderProps {
  onOpenNewTransaction: () => void;
  isRealtimeConnected: boolean;
  onOpenCommandPalette?: () => void;
  activeWorkspace?: string;
}
```
2. Adicione `Search` nos imports de `lucide-react`.
3. No corpo do componente, desestruture `onOpenCommandPalette` e `activeWorkspace`.
4. No JSX, inclua o botão de busca rápida para `Cmd+K` ao lado do status Realtime:
```tsx
{onOpenCommandPalette && (
  <button
    onClick={onOpenCommandPalette}
    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border/50 transition-colors cursor-pointer"
    title="Buscar ou abrir comando (⌘K)"
  >
    <Search className="h-3.5 w-3.5" />
    <span>Buscar ou navegar...</span>
    <kbd className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
  </button>
)}
```

---

### 5. [MODIFICAR] `src/components/dashboard/dashboard-view.tsx`
No arquivo `src/components/dashboard/dashboard-view.tsx`:
1. Importe os novos componentes:
```tsx
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
```
2. Adicione o estado para abrir/fechar o Command Palette:
```tsx
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
```
3. Também capture atalhos de teclado no dashboard:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandPaletteOpen((prev) => !prev);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```
4. Reestruture o layout de retorno para envolver a `DesktopSidebar` e a `div` flex principal:
```tsx
return (
  <div className="min-h-screen bg-background flex selection:bg-emerald-500/20">
    {/* Sidebar Desktop Linear */}
    <DesktopSidebar
      activeWorkspace={workspace}
      onWorkspaceChange={handleWorkspaceChange}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      onOpenNewTransaction={handleOpenNew}
    />

    {/* Conteúdo Principal */}
    <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
      <Header
        onOpenNewTransaction={handleOpenNew}
        isRealtimeConnected={isRealtimeConnected}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeWorkspace={workspace}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl pb-28 md:pb-12">
        {/* Daily Briefing Card */}
        <DailyBriefingCard
          userId={userId || undefined}
          onNavigateWorkspace={handleWorkspaceChange}
        />

        {/* Voice Command Bar */}
        <VoiceCommandBar
          onTransactionAdded={handleVoiceTransactionAdded}
          onWorkspaceSwitch={handleWorkspaceChange}
          currentWorkspace={workspace}
        />

        {/* Workspaces Views (gstore, pwlabs, acto, pessoal) */}
        {workspace === 'gstore' && ( ... )}
        {workspace === 'pwlabs' && ( ... )}
        {workspace === 'acto' && ( ... )}
        {workspace === 'pessoal' && ( ... )}
      </main>

      {/* Bottom Nav Bar Exclusiva para Mobile */}
      <BottomNavBar
        activeWorkspace={workspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
    </div>

    {/* Command Palette Global Cmd+K */}
    <CommandPalette
      isOpen={isCommandPaletteOpen}
      onClose={() => setIsCommandPaletteOpen(false)}
      onSelectWorkspace={handleWorkspaceChange}
      onOpenNewTransaction={handleOpenNew}
      onOpenOCR={() => setIsBulkOCROpen(true)}
    />

    {/* Modais existentes (Nova Transação, Bulk OCR) */}
    {isNewModalOpen && ( ... )}
    <BulkOCRModal ... />
  </div>
);
```

---

## ⚡ VALIDAÇÃO & COMMIT
Execute no terminal:
```bash
npm run build
git add .
git commit -m "feat(ui): implement Linear desktop sidebar, Raycast command palette and responsive mobile isolation"
git push origin main
```

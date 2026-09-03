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

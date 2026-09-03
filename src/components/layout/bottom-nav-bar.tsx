'use client';

import React from 'react';
import { ShoppingBag, Briefcase, Layers, Wallet } from 'lucide-react';
import { WorkspaceId, WORKSPACE_STORAGE_KEY } from '@/types/workspace';

interface BottomNavBarProps {
  activeWorkspace: WorkspaceId;
  onWorkspaceChange: (workspace: WorkspaceId) => void;
  contadores?: {
    gstore: number;
    pwlabs: number;
    acto: number;
    pessoal: number;
  };
}

const navItems: { id: WorkspaceId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'gstore', label: 'G-Store', icon: ShoppingBag },
  { id: 'pwlabs', label: 'PW Labs', icon: Briefcase },
  { id: 'acto', label: 'Acto', icon: Layers },
  { id: 'pessoal', label: 'Pessoal', icon: Wallet },
];

function getColorForWorkspace(id: WorkspaceId): string {
  switch (id) {
    case 'gstore': return 'text-purple-500';
    case 'pwlabs': return 'text-blue-500';
    case 'acto': return 'text-orange-500';
    case 'pessoal': return 'text-emerald-500';
  }
}

function getBgColorForWorkspace(id: WorkspaceId): string {
  switch (id) {
    case 'gstore': return 'bg-purple-500/10';
    case 'pwlabs': return 'bg-blue-500/10';
    case 'acto': return 'bg-orange-500/10';
    case 'pessoal': return 'bg-emerald-500/10';
  }
}

export function BottomNavBar({ activeWorkspace, onWorkspaceChange, contadores = { gstore: 0, pwlabs: 0, acto: 0, pessoal: 0 } }: BottomNavBarProps) {
  const handleWorkspaceClick = (workspaceId: WorkspaceId) => {
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    }
    onWorkspaceChange(workspaceId);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom,16px)] pt-2 px-4"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeWorkspace === item.id;
          const Icon = item.icon;
          const count = contadores[item.id] || 0;

          return (
            <button
              key={item.id}
              onClick={() => handleWorkspaceClick(item.id)}
              className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg
                transition-all duration-200 ease-out min-w-[70px]
                ${isActive
                  ? `${getBgColorForWorkspace(item.id)}`
                  : 'hover:bg-muted/50'
                }
              `}
              aria-label={`Navegar para ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`
                    h-5 w-5 transition-transform duration-200
                    ${isActive ? getColorForWorkspace(item.id) : 'text-muted-foreground'}
                    ${isActive ? 'scale-110' : 'scale-100'}
                  `}
                />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-medium min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className={`
                text-[11px] font-medium transition-colors duration-200
                ${isActive
                  ? getColorForWorkspace(item.id)
                  : 'text-muted-foreground'
                }
              `}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

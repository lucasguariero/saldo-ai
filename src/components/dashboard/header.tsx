'use client';

import React from 'react';
import { Sparkles, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  isRealtimeConnected: boolean;
}

export function Header({ onOpenNewTransaction, isRealtimeConnected }: HeaderProps) {
  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
                Kora
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Finance
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Painel Financeiro Automatizado via Telegram & n8n
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Realtime */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
            <span className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">
              {isRealtimeConnected ? 'Supabase Realtime Ativo' : 'Modo Demonstração'}
            </span>
          </div>

          <Button 
            onClick={onOpenNewTransaction} 
            className="gap-1.5 shadow-sm font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Transação</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

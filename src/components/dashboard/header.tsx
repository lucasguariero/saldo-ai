'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Radio, LogOut, User as UserIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  isRealtimeConnected: boolean;
  onOpenCommandPalette?: () => void;
  activeWorkspace?: string;
}

export function Header({ onOpenNewTransaction, isRealtimeConnected, onOpenCommandPalette, activeWorkspace }: HeaderProps) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    // Only create client in browser with env vars
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
                Saldo
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Gestão Financeira Inteligente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão Command Palette (Desktop) */}
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

          {/* Status Realtime */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
            <span className={`h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">
              {isRealtimeConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* User Menu */}
          {user && supabase && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span className="hidden md:inline truncate max-w-[120px]">
                {user.email}
              </span>
            </div>
          )}

          <Button
            onClick={onOpenNewTransaction}
            className="gap-1.5 shadow-sm font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transação</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

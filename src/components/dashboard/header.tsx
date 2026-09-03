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

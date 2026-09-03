'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Package, Briefcase, Layers, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { WorkspaceId } from '@/types/workspace';

interface BriefingItem {
  tipo: 'finance' | 'gstore' | 'pwlabs' | 'acto';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
}

interface DailyBriefing {
  data: string;
  resumo: string;
  itens: BriefingItem[];
}

interface DailyBriefingCardProps {
  userId?: string;
  onNavigateWorkspace?: (workspace: WorkspaceId) => void;
}

export function DailyBriefingCard({ userId, onNavigateWorkspace }: DailyBriefingCardProps) {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const headers: Record<string, string> = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const res = await fetch('/api/ai/daily-briefing', { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch briefing');
      }
      const data = await res.json();
      setBriefing(data);
    } catch (err) {
      setError('Não foi possível carregar o briefing');
      console.error('Briefing error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [userId]);

  const handleItemClick = (tipo: BriefingItem['tipo']) => {
    if (!onNavigateWorkspace) return;
    switch (tipo) {
      case 'gstore': onNavigateWorkspace('gstore'); break;
      case 'pwlabs': onNavigateWorkspace('pwlabs'); break;
      case 'acto': onNavigateWorkspace('acto'); break;
      case 'finance': onNavigateWorkspace('pessoal'); break;
    }
  };

  const getIcon = (tipo: BriefingItem['tipo']) => {
    switch (tipo) {
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'gstore': return <Package className="h-4 w-4" />;
      case 'pwlabs': return <Briefcase className="h-4 w-4" />;
      case 'acto': return <Layers className="h-4 w-4" />;
    }
  };

  const getUrgenciaCor = (urgencia: BriefingItem['urgencia']) => {
    switch (urgencia) {
      case 'alta': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'media': return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
      case 'baixa': return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    }
  };

  if (dismissed) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 via-emerald-500/5 to-teal-500/5 border-primary/20 shadow-xs animate-pulse">
        <CardContent className="p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
              <span>✦ Jarvis analisando o panorama operacional do seu dia...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !briefing) {
    return (
      <Card className="bg-card/80 border-border/40 p-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>✦ Jarvis: Operando em modo padrão. Clique para sincronizar pendências.</span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchBriefing} className="h-7 text-xs">
          <RefreshCw className="h-3 w-3 mr-1" /> Sincronizar
        </Button>
      </Card>
    );
  }

  if (briefing.itens.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-500/20 shadow-xs relative">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ✦ Jarvis Briefing
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Tudo em ordem para hoje!
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {briefing.resumo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchBriefing}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Atualizar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Ocultar"
            >
              <span className="text-xs">✕</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-500/20 shadow-xs">
      <CardContent className="p-3.5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  ✦ Jarvis Briefing
                </span>
                <span className="text-xs font-bold text-foreground">
                  Panorama Operacional do Dia
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {briefing.resumo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBriefing}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Ocultar"
            >
              <span className="text-xs">✕</span>
            </Button>
          </div>
        </div>

        {/* Itens de pendência clicáveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {briefing.itens.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item.tipo)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] border border-border/40 ${getUrgenciaCor(item.urgencia)}`}
            >
              <span className="mt-0.5 p-1 rounded-md bg-background/50 shadow-2xs">{getIcon(item.tipo)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-foreground">{item.titulo}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.descricao}</p>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground opacity-60 self-center">➔</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

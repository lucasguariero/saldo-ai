'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Package, Briefcase, Layers, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
}

export function DailyBriefingCard({ userId }: DailyBriefingCardProps) {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/daily-briefing');
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

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando panorama operacional...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !briefing) {
    return null;
  }

  if (briefing.itens.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                Bom dia! Aqui está o seu panorama operacional:
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {briefing.resumo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber/20">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Bom dia! Aqui está o seu panorama operacional:
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBriefing}
            className="h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Itens de pendência */}
        <div className="space-y-2">
          {briefing.itens.map((item, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 rounded-lg ${getUrgenciaCor(item.urgencia)}`}
            >
              <span className="mt-0.5">{getIcon(item.tipo)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.titulo}</p>
                <p className="text-xs opacity-80 truncate">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  FileText,
  Settings,
  CheckCircle2,
  XCircle,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CRMDeal,
  EstagioDealPWlabs,
  PWlabsKPIs
} from '@/types/crm';
import { createClient } from '@/lib/supabase/client';

interface DealsKanbanProps {
  userId: string;
}

const ESTAGIOS: { id: EstagioDealPWlabs; label: string; icone: React.ReactNode; cor: string }[] = [
  { id: 'PROSPECCAO', label: 'Prospecção', icone: <Target className="h-4 w-4" />, cor: 'bg-blue-500' },
  { id: 'PROPOSTA', label: 'Proposta', icone: <FileText className="h-4 w-4" />, cor: 'bg-amber-500' },
  { id: 'PRODUCAO', label: 'Produção', icone: <Settings className="h-4 w-4" />, cor: 'bg-purple-500' },
  { id: 'FECHADO', label: 'Fechado', icone: <CheckCircle2 className="h-4 w-4" />, cor: 'bg-emerald-500' },
];

export function DealsKanban({ userId }: DealsKanbanProps) {
  const supabase = createClient();
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('crm_deals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDeals(data as CRMDeal[]);
      }
      setLoading(false);
    }

    fetchDeals();
  }, [userId, supabase]);

  // KPIs
  const kpis = useMemo((): PWlabsKPIs => {
    const dealsPorEstagio = {
      PROSPECCAO: deals.filter(d => d.estagio === 'PROSPECCAO').length,
      PROPOSTA: deals.filter(d => d.estagio === 'PROPOSTA').length,
      PRODUCAO: deals.filter(d => d.estagio === 'PRODUCAO').length,
      FECHADO: deals.filter(d => d.estagio === 'FECHADO').length,
      PERDIDO: deals.filter(d => d.estagio === 'PERDIDO').length,
    };

    const valorFechado = deals
      .filter(d => d.estagio === 'FECHADO')
      .reduce((sum, d) => sum + Number(d.valor_estimado), 0);

    const valorTotalPipeline = deals
      .filter(d => d.estagio !== 'FECHADO' && d.estagio !== 'PERDIDO')
      .reduce((sum, d) => sum + Number(d.valor_estimado), 0);

    const taxaConversao = deals.length > 0
      ? (dealsPorEstagio.FECHADO / (dealsPorEstagio.FECHADO + dealsPorEstagio.PERDIDO)) * 100
      : 0;

    return {
      totalDeals: deals.length,
      valorTotalPipeline,
      valorFechado,
      taxaConversao,
      dealsPorEstagio,
    };
  }, [deals]);

  // Deals por estágio
  const dealsPorEstagio = useMemo(() => {
    const grouped: Record<EstagioDealPWlabs | 'PERDIDO', CRMDeal[]> = {
      PROSPECCAO: [],
      PROPOSTA: [],
      PRODUCAO: [],
      FECHADO: [],
      PERDIDO: [],
    };

    deals.forEach(d => {
      grouped[d.estagio].push(d);
    });

    return grouped;
  }, [deals]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return <div className="p-8 text-center">Carregando pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Total Deals</span>
            </div>
            <p className="text-xl font-bold">{kpis.totalDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Pipeline</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(kpis.valorTotalPipeline)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Fechado</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(kpis.valorFechado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Taxa Conversão</span>
            </div>
            <p className="text-xl font-bold">{kpis.taxaConversao.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ESTAGIOS.map(estagio => (
          <div key={estagio.id} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className={`h-3 w-3 rounded-full ${estagio.cor}`} />
              <span className="font-medium text-sm">{estagio.icone}</span>
              <span className="font-medium text-sm">{estagio.label}</span>
              <Badge variant="secondary" className="ml-auto">
                {dealsPorEstagio[estagio.id].length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {dealsPorEstagio[estagio.id].map(deal => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-2">{deal.titulo_deal}</h4>
                    </div>

                    {deal.empresa && (
                      <p className="text-xs text-muted-foreground">{deal.empresa}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(deal.valor_estimado)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{deal.contato_nome}</span>
                    </div>

                    {deal.servicos && deal.servicos.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {deal.servicos.slice(0, 2).map((servico, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {servico}
                          </Badge>
                        ))}
                        {deal.servicos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{deal.servicos.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {deal.proxima_acao && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{deal.proxima_acao}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {dealsPorEstagio[estagio.id].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Nenhum deal
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

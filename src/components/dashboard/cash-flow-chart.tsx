'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FluxoDia } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface CashFlowChartProps {
  dados: FluxoDia[];
}

export function CashFlowChart({ dados }: CashFlowChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Fluxo Financeiro Recente</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">Entradas vs Saídas</span>
      </CardHeader>
      <CardContent className="pt-2">
        {dados.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
            <span>Sem movimentações para exibir no gráfico.</span>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis 
                  dataKey="dataLabel" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="saidasPagas" name="Saídas Pagas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="saidasPendentes" name="Pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

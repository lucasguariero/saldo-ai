'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CategoriaGasto } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import { PieChart, Layers } from 'lucide-react';

interface CategoryBreakdownProps {
  categorias: CategoriaGasto[];
}

const CATEGORY_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-cyan-500',
];

export function CategoryBreakdown({ categorias }: CategoryBreakdownProps) {
  const topCategorias = categorias.slice(0, 6);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <PieChart className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Gastos por Categoria</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">
          {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
        </span>
      </CardHeader>
      <CardContent>
        {topCategorias.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Layers className="h-8 w-8 text-muted-foreground/40" />
            <span>Nenhuma despesa registrada neste período.</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {topCategorias.map((item, index) => {
              const colorClass = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <div key={item.categoria} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[180px]">
                      {item.categoria}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {item.porcentagem.toFixed(1)}%
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${Math.max(item.porcentagem, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

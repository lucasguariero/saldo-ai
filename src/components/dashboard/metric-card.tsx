import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'rose' | 'amber' | 'indigo';
  extraInfo?: React.ReactNode;
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10 text-primary',
    border: 'border-border/60 hover:border-border',
    glow: 'from-primary/5 to-transparent',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 hover:border-emerald-500/30',
    glow: 'from-emerald-500/5 to-transparent',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20 hover:border-rose-500/30',
    glow: 'from-rose-500/5 to-transparent',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20 hover:border-amber-500/30',
    glow: 'from-amber-500/5 to-transparent',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20 hover:border-indigo-500/30',
    glow: 'from-indigo-500/5 to-transparent',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  extraInfo,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-200 shadow-sm', styles.border)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', styles.glow)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={cn('p-2 rounded-xl flex items-center justify-center', styles.iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
          {extraInfo && <div className="mt-2">{extraInfo}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

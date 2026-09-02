'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const goToCurrentMonth = () => {
    onDateChange(new Date());
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Botão Mês Anterior */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-8 w-8"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Texto do Mês / Ano */}
      <div className="flex items-center gap-2 min-w-[180px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold capitalize">
          {monthName} de {year}
        </span>
      </div>

      {/* Botão Próximo Mês */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className="h-8 w-8"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Botão Voltar ao Mês Atual (só aparece se não estiver no mês atual) */}
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentMonth}
          className="ml-2 h-7 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
        >
          Mês Atual
        </Button>
      )}
    </div>
  );
}

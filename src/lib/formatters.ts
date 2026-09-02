import { TipoTransacao, FormaPagamento } from '@/types/finance';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  // Trata formatos YYYY-MM-DD para evitar shift de fuso horário
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

export function getTipoConfig(tipo: TipoTransacao) {
  switch (tipo) {
    case 'ENTRADA':
      return {
        label: 'Entrada',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        prefix: '+',
      };
    case 'SAIDA_PAGA':
      return {
        label: 'Saída Paga',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
        textColor: 'text-rose-600 dark:text-rose-400',
        prefix: '-',
      };
    case 'SAIDA_PENDENTE':
      return {
        label: 'Pendente',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        prefix: '-',
      };
    default:
      return {
        label: tipo,
        badgeClass: 'bg-slate-500/15 text-slate-600 border-slate-500/20',
        textColor: 'text-slate-600',
        prefix: '',
      };
  }
}

export function getFormaPagamentoLabel(forma: FormaPagamento): string {
  switch (forma) {
    case 'PIX':
      return 'PIX';
    case 'DEBITO':
      return 'Débito';
    case 'CREDITO':
      return 'Crédito';
    case 'DINHEIRO':
      return 'Dinheiro';
    default:
      return forma;
  }
}

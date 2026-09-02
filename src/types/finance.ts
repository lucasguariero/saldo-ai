export type TipoTransacao = 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';

export type FormaPagamento = 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';

export interface Transacao {
  id: string;
  created_at: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  forma_pagamento: FormaPagamento;
  observacao?: string | null;
  data_transacao: string; // YYYY-MM-DD
  data_vencimento?: string | null; // YYYY-MM-DD
  user_id?: string | null;
}

export type NovaTransacaoInput = Omit<Transacao, 'id' | 'created_at'>;

export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidasPagas: number;
  totalSaidasPendentes: number;
  saldoAtual: number; // Entradas - Saidas Pagas
  saldoProjetado: number; // Entradas - (Saidas Pagas + Saidas Pendentes)
  quantidadeTransacoes: number;
}

export interface CategoriaGasto {
  categoria: string;
  total: number;
  quantidade: number;
  porcentagem: number;
}

export interface FluxoDia {
  data: string;
  dataLabel: string;
  entradas: number;
  saidasPagas: number;
  saidasPendentes: number;
}

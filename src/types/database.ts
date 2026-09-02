export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      transacoes: {
        Row: {
          id: string;
          created_at: string;
          descricao: string;
          valor: number;
          tipo: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
          categoria: string;
          forma_pagamento: 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';
          observacao: string | null;
          data_transacao: string;
          data_vencimento: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          descricao: string;
          valor: number;
          tipo: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
          categoria: string;
          forma_pagamento: 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';
          observacao?: string | null;
          data_transacao: string;
          data_vencimento?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          descricao?: string;
          valor?: number;
          tipo?: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
          categoria?: string;
          forma_pagamento?: 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';
          observacao?: string | null;
          data_transacao?: string;
          data_vencimento?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tipo_transacao: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
      forma_pagamento: 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

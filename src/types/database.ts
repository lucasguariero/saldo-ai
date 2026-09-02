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
          workspace_id: string | null;
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
          workspace_id?: string | null;
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
          workspace_id?: string | null;
        };
        Relationships: [];
      };
      produtos_estoque: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          workspace_id: string;
          titulo: string;
          marca: string | null;
          modelo: string | null;
          categoria: string;
          condicao: 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';
          custo_aquisicao: number;
          preco_sugerido_min: number | null;
          preco_sugerido_max: number | null;
          preco_anunciado: number | null;
          preco_venda_final: number | null;
          margem_estimada_perc: number | null;
          status: 'COMPRADO_PREPARACAO' | 'PENDENTE_ANUNCIO' | 'ANUNCIADO' | 'VENDIDO' | 'DEVOLVIDO';
          especificacoes: Json;
          descricao_anuncio: string | null;
          links_fotos: string[] | null;
          canais_anuncio: string[] | null;
          data_aquisicao: string;
          data_venda: string | null;
          observacao: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          workspace_id?: string;
          titulo: string;
          marca?: string | null;
          modelo?: string | null;
          categoria?: string;
          condicao?: 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';
          custo_aquisicao: number;
          preco_sugerido_min?: number | null;
          preco_sugerido_max?: number | null;
          preco_anunciado?: number | null;
          preco_venda_final?: number | null;
          margem_estimada_perc?: number | null;
          status?: 'COMPRADO_PREPARACAO' | 'PENDENTE_ANUNCIO' | 'ANUNCIADO' | 'VENDIDO' | 'DEVOLVIDO';
          especificacoes?: Json;
          descricao_anuncio?: string | null;
          links_fotos?: string[] | null;
          canais_anuncio?: string[] | null;
          data_aquisicao?: string;
          data_venda?: string | null;
          observacao?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
          titulo?: string;
          marca?: string | null;
          modelo?: string | null;
          categoria?: string;
          condicao?: 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';
          custo_aquisicao?: number;
          preco_sugerido_min?: number | null;
          preco_sugerido_max?: number | null;
          preco_anunciado?: number | null;
          preco_venda_final?: number | null;
          margem_estimada_perc?: number | null;
          status?: 'COMPRADO_PREPARACAO' | 'PENDENTE_ANUNCIO' | 'ANUNCIADO' | 'VENDIDO' | 'DEVOLVIDO';
          especificacoes?: Json;
          descricao_anuncio?: string | null;
          links_fotos?: string[] | null;
          canais_anuncio?: string[] | null;
          data_aquisicao?: string;
          data_venda?: string | null;
          observacao?: string | null;
        };
        Relationships: [];
      };
      crm_deals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          workspace_id: string;
          titulo_deal: string;
          empresa: string | null;
          contato_nome: string;
          contato_telefone: string | null;
          contato_email: string | null;
          valor_estimado: number;
          estagio: 'PROSPECCAO' | 'PROPOSTA' | 'PRODUCAO' | 'FECHADO' | 'PERDIDO';
          servicos: string[] | null;
          proxima_acao: string | null;
          data_proxima_acao: string | null;
          notas: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          workspace_id?: string;
          titulo_deal: string;
          empresa?: string | null;
          contato_nome: string;
          contato_telefone?: string | null;
          contato_email?: string | null;
          valor_estimado?: number;
          estagio?: 'PROSPECCAO' | 'PROPOSTA' | 'PRODUCAO' | 'FECHADO' | 'PERDIDO';
          servicos?: string[] | null;
          proxima_acao?: string | null;
          data_proxima_acao?: string | null;
          notas?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          workspace_id?: string;
          titulo_deal?: string;
          empresa?: string | null;
          contato_nome?: string;
          contato_telefone?: string | null;
          contato_email?: string | null;
          valor_estimado?: number;
          estagio?: 'PROSPECCAO' | 'PROPOSTA' | 'PRODUCAO' | 'FECHADO' | 'PERDIDO';
          servicos?: string[] | null;
          proxima_acao?: string | null;
          data_proxima_acao?: string | null;
          notas?: string | null;
        };
        Relationships: [];
      };
      pessoal_tarefas: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          workspace_id: string;
          titulo: string;
          descricao: string | null;
          concluida: boolean;
          prioridade: string;
          data_limite: string | null;
          horario: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          workspace_id?: string;
          titulo: string;
          descricao?: string | null;
          concluida?: boolean;
          prioridade?: string;
          data_limite?: string | null;
          horario?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          workspace_id?: string;
          titulo?: string;
          descricao?: string | null;
          concluida?: boolean;
          prioridade?: string;
          data_limite?: string | null;
          horario?: string | null;
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
      status_produto_gstore: 'COMPRADO_PREPARACAO' | 'PENDENTE_ANUNCIO' | 'ANUNCIADO' | 'VENDIDO' | 'DEVOLVIDO';
      estagio_deal_pwlabs: 'PROSPECCAO' | 'PROPOSTA' | 'PRODUCAO' | 'FECHADO' | 'PERDIDO';
      condicao_produto: 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

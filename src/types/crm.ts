// Tipos para o CRM Multi-Workspace

// ============================================
// ENUMS (alinhar com o banco)
// ============================================

export type StatusProdutoGStore =
  | 'COMPRADO_PREPARACAO'
  | 'PENDENTE_ANUNCIO'
  | 'ANUNCIADO'
  | 'VENDIDO'
  | 'DEVOLVIDO';

export type EstagioDealPWlabs =
  | 'PROSPECCAO'
  | 'PROPOSTA'
  | 'PRODUCAO'
  | 'FECHADO'
  | 'PERDIDO';

export type CondicaoProduto = 'NOVO' | 'USADO_EXCELENTE' | 'USADO_BOM' | 'COM_DEFEITO';

export type Workspace = 'pwlabs' | 'gstore' | 'pessoal';

// ============================================
// INTERFACES
// ============================================

// --------------------------------------------
// G-Store: Produtos para Revenda
// --------------------------------------------
export interface ProdutoEstoque {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: Workspace;
  titulo: string;
  marca?: string;
  modelo?: string;
  categoria: string;
  condicao: CondicaoProduto;
  custo_aquisicao: number;
  preco_sugerido_min?: number;
  preco_sugerido_max?: number;
  preco_anunciado?: number;
  preco_venda_final?: number;
  margem_estimada_perc?: number;
  status: StatusProdutoGStore;
  especificacoes: Record<string, unknown>;
  descricao_anuncio?: string;
  links_fotos?: string[];
  canais_anuncio?: string[];
  data_aquisicao: string;
  data_venda?: string;
  observacao?: string;
}

export interface ProdutoEstoqueInput {
  titulo: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  condicao?: CondicaoProduto;
  custo_aquisicao: number;
  preco_sugerido_min?: number;
  preco_sugerido_max?: number;
  preco_anunciado?: number;
  preco_venda_final?: number;
  margem_estimada_perc?: number;
  status?: StatusProdutoGStore;
  especificacoes?: Record<string, unknown>;
  descricao_anuncio?: string;
  links_fotos?: string[];
  canais_anuncio?: string[];
  data_aquisicao?: string;
  data_venda?: string;
  observacao?: string;
}

// KPIs da G-Store
export interface GStoreKPIs {
  totalInvestido: number;
  faturamentoProjetado: number;
  lucroBrutoEstimado: number;
  itensPendentesAnuncio: number;
  totalProdutos: number;
  produtosVendidos: number;
}

// --------------------------------------------
// PW Labs: Deals B2B
// --------------------------------------------
export interface CRMDeal {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: Workspace;
  titulo_deal: string;
  empresa?: string;
  contato_nome: string;
  contato_telefone?: string;
  contato_email?: string;
  valor_estimado: number;
  estagio: EstagioDealPWlabs;
  servicos?: string[];
  proxima_acao?: string;
  data_proxima_acao?: string;
  notas?: string;
}

export interface CRMDealInput {
  titulo_deal: string;
  empresa?: string;
  contato_nome: string;
  contato_telefone?: string;
  contato_email?: string;
  valor_estimado?: number;
  estagio?: EstagioDealPWlabs;
  servicos?: string[];
  proxima_acao?: string;
  data_proxima_acao?: string;
  notas?: string;
}

// KPIs do PW Labs
export interface PWlabsKPIs {
  totalDeals: number;
  valorTotalPipeline: number;
  valorFechado: number;
  taxaConversao: number;
  dealsPorEstagio: Record<EstagioDealPWlabs, number>;
}

// --------------------------------------------
// Pessoal: Tarefas e Rotina
// --------------------------------------------
export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface TarefaPessoal {
  id: string;
  created_at: string;
  user_id: string;
  workspace_id: Workspace;
  titulo: string;
  descricao?: string;
  concluida: boolean;
  prioridade: PrioridadeTarefa;
  data_limite?: string;
  horario?: string;
}

export interface TarefaPessoalInput {
  titulo: string;
  descricao?: string;
  concluida?: boolean;
  prioridade?: PrioridadeTarefa;
  data_limite?: string;
  horario?: string;
}

// KPIs Pessoal
export interface PessoalKPIs {
  totalTarefas: number;
  tarefasConcluidas: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
}

// ============================================
// TIPOS DE DETECÇÃO DE INTENÇÃO (AI)
// ============================================

export type TipoIntento =
  | 'GSTORE_PRODUTO'
  | 'PWLABS_DEAL'
  | 'PESSOAL_FINANCE'
  | 'PESSOAL_TAREFA';

export interface ResultadoClassificacao {
  tipo: TipoIntento;
  confianca: number;
  dados: {
    // GSTORE_PRODUTO
    produto?: Partial<ProdutoEstoqueInput>;
    // PWLABS_DEAL
    deal?: Partial<CRMDealInput>;
    // PESSOAL_FINANCE
    transacao?: {
      descricao: string;
      valor: number;
      tipo: 'ENTRADA' | 'SAIDA_PAGA' | 'SAIDA_PENDENTE';
      categoria?: string;
      forma_pagamento?: string;
    };
    // PESSOAL_TAREFA
    tarefa?: Partial<TarefaPessoalInput>;
  };
}

// ============================================
// WORKSPACE STATE
// ============================================

export interface WorkspaceState {
  ativo: Workspace;
  transicoes: {
    gstore: number;
    pwlabs: number;
    pessoal: number;
  };
}

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

export type TipoOperacaoGStore = 'REVENDA_ESTOQUE' | 'AFILIADO';

// Novos tipos para flips e afiliados
export type StatusFlipGStore = 'em_transito' | 'recebido_sem_fotos' | 'anunciado' | 'vendido' | 'devolvido';
export type CanalVenda = 'olx' | 'facebook' | 'site' | 'instagram';
export type PlataformaAfiliado = 'shopee' | 'amazon' | 'tiktok_shop';

// Tipos Acto
export type ProjetoActo = 'inema' | 'eleitores' | 'crm_acto';
export type EngineDesign = 'gemini' | 'claude';

export type Workspace = 'pwlabs' | 'gstore' | 'pessoal' | 'acto';

// --------------------------------------------
// Benchmark do Mercado Livre
// --------------------------------------------
export interface ConcorrenteBenchmark {
  titulo: string;
  preco: number;
  permalink: string;
  thumbnail: string;
}

// ============================================
// INTERFACES
// ============================================

// --------------------------------------------
// G-Store: Produtos para Revenda (Flips & Afiliados)
// --------------------------------------------
export interface ProdutoEstoque {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  workspace_id: Workspace;
  tipo_operacao?: TipoOperacaoGStore;
  titulo: string;
  marca?: string | null;
  modelo?: string | null;
  categoria: string;
  condicao: CondicaoProduto;

  // Flip / Arbitragem Financeira
  custo_bruto?: number | null;
  cashback?: number | null;
  custo_liquido?: number | null;
  custo_aquisicao?: number | null; // Campo original para compatibilidade
  preco_varejo_referencia?: number | null;

  // Campos de benchmark
  preco_piso_giro_rapido?: number | null;
  preco_teto_mercado?: number | null;
  preco_mediana_mercado?: number | null;
  preco_sugerido_min?: number | null;
  preco_sugerido_max?: number | null;
  preco_anunciado?: number | null;
  preco_venda_final?: number | null;
  margem_estimada_perc?: number | null;

  // Status do Flip
  status: StatusFlipGStore | StatusProdutoGStore;

  // Canais de venda (checkboxes)
  canais_venda?: CanalVenda[];

  // Fotos
  fotos_referencia?: string[] | null;
  fotos_reais?: string[] | null;
  foto_capa?: string | null;

  // Benchmark de concorrentes
  benchmark_concorrentes?: ConcorrenteBenchmark[] | null;

  // Descrição e especificações
  especificacoes?: Record<string, unknown>;
  descricao_anuncio?: string | null;
  canais_anuncio?: string[] | null;
  data_aquisicao: string;
  data_venda?: string | null;
  observacao?: string | null;

  // Afiliados
  link_afiliado?: string | null;
  plataforma_afiliado?: PlataformaAfiliado | null;
  cupom_desconto?: string | null;
  comissao_estimada_reais?: number | null;
  copy_stories?: string | null;
  loja_afiliada?: string | null;
}

export interface ProdutoEstoqueInput {
  tipo_operacao?: TipoOperacaoGStore;
  titulo: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  condicao?: CondicaoProduto;
  custo_aquisicao: number;
  // Campos de benchmark
  preco_piso_giro_rapido?: number;
  preco_teto_mercado?: number;
  preco_mediana_mercado?: number;
  preco_sugerido_min?: number;
  preco_sugerido_max?: number;
  preco_anunciado?: number;
  preco_venda_final?: number;
  margem_estimada_perc?: number;
  // Fotos
  fotos_referencia?: string[];
  fotos_reais?: string[];
  foto_capa?: string;
  // Benchmark
  benchmark_concorrentes?: ConcorrenteBenchmark[];
  // Campos existentes
  status?: StatusProdutoGStore;
  especificacoes?: Record<string, unknown>;
  descricao_anuncio?: string;
  canais_anuncio?: string[];
  data_aquisicao?: string;
  data_venda?: string;
  observacao?: string;
  // Afiliado
  link_afiliado?: string;
  loja_afiliada?: string;
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

// --------------------------------------------
// Acto: Specs de Design
// --------------------------------------------
export interface ActoSpec {
  id: string;
  created_at: string;
  user_id: string;
  projeto: ProjetoActo;
  titulo: string;
  prompt_briefing?: string;
  imagem_referencia_url?: string;
  engine_usada: EngineDesign;
  especificacao_markdown: string;
  codigo_tailwind?: string;
  prompt_google_stitch?: string;
  prompt_figma?: string;
}

// --------------------------------------------
// PW Labs: Campanhas de E-mail
// --------------------------------------------
export interface PWlabsCampanha {
  id: string;
  created_at: string;
  user_id: string;
  titulo: string;
  assunto: string;
  conteudo_html: string;
  tags_segmentacao?: string[];
  total_enviados?: number;
  status?: 'RASCUNHO' | 'ENVIANDO' | 'CONCLUIDO';
}

// --------------------------------------------
// OCR: Transações Extraídas de Extratos
// --------------------------------------------
export interface OCRTransacaoExtraida {
  id_temp: string;
  selecionada: boolean;
  descricao: string;
  valor: number;
  tipo: 'SAIDA_PAGA' | 'SAIDA_PENDENTE' | 'ENTRADA';
  data_transacao: string;
  data_vencimento?: string;
  categoria: string;
  forma_pagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'BOLETO';
  confianca: number;
  is_reembolso_gstore?: boolean;
}

// ============================================
// TIPOS DE DETECÇÃO DE INTENÇÃO (AI)
// ============================================

export type TipoIntento =
  | 'GSTORE_REVENDA'
  | 'GSTORE_AFILIADO'
  | 'GSTORE_PRODUTO'  // Retrocompatibilidade
  | 'PWLABS_DEAL'
  | 'ACTO_DEMANDA'
  | 'PESSOAL_FINANCE'
  | 'PESSOAL_TAREFA';

export interface ResultadoClassificacao {
  tipo: TipoIntento;
  confianca: number;
  dados: {
    // GSTORE_REVENDA (estoque próprio)
    produto?: Partial<ProdutoEstoqueInput>;
    // GSTORE_AFILIADO
    afiliado?: {
      titulo: string;
      marca?: string;
      loja_afiliada?: string;
      link_afiliado?: string;
    };
    // PWLABS_DEAL
    deal?: Partial<CRMDealInput>;
    // ACTO_DEMANDA
    demanda?: {
      projeto: 'flora' | 'citypro' | 'ferramentas';
      titulo: string;
      descricao?: string;
      prioridade?: 'urgente' | 'alta' | 'normal' | 'baixa';
      estimativa?: string;
    };
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

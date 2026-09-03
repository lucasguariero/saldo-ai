import OpenAI from 'openai';
import {
  NovaTransacaoInput,
  TipoTransacao,
  FormaPagamento
} from '@/types/finance';
import {
  ProdutoEstoqueInput,
  CRMDealInput,
  TarefaPessoalInput,
  TipoIntento,
  ResultadoClassificacao
} from '@/types/crm';

function getAIClient() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      client: new OpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://saldo-ai.vercel.app',
          'X-Title': 'Saldo AI',
        },
      }),
      isOpenRouter: true,
      textModel: 'google/gemini-2.5-flash',
      audioModel: 'google/gemini-2.5-flash',
    };
  }

  const openAIKey = process.env.OPENAI_API_KEY;
  if (openAIKey) {
    return {
      client: new OpenAI({ apiKey: openAIKey }),
      isOpenRouter: false,
      textModel: 'gpt-4o-mini',
      audioModel: 'whisper-1',
    };
  }

  throw new Error('Nenhuma chave de IA configurada. Configure OPENROUTER_API_KEY ou OPENAI_API_KEY no ambiente.');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function sanitizeTipo(tipo: any): TipoTransacao {
  const t = String(tipo || '').toUpperCase();
  if (t.includes('ENTRADA')) return 'ENTRADA';
  if (t.includes('PENDENTE') || t.includes('FUTUR') || t.includes('FATURA')) return 'SAIDA_PENDENTE';
  return 'SAIDA_PAGA';
}

function sanitizeForma(forma: any): FormaPagamento {
  const f = String(forma || '').toUpperCase();
  if (f.includes('PIX')) return 'PIX';
  if (f.includes('CREDIT') || f.includes('CRÉDIT')) return 'CREDITO';
  if (f.includes('DINHEIR') || f.includes('ESPECIE')) return 'DINHEIRO';
  return 'DEBITO';
}

function parseSafeNumber(val: any, fallback: number | null = null): number | null {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

function sanitizeCondicao(condicao: any): string {
  const c = String(condicao || '').toUpperCase();
  if (c.includes('NOVO')) return 'NOVO';
  if (c.includes('EXCELENTE')) return 'USADO_EXCELENTE';
  if (c.includes('BOM')) return 'USADO_BOM';
  return 'USADO_EXCELENTE'; // default
}

function sanitizeEstagio(estagio: any): string {
  const e = String(estagio || '').toUpperCase();
  if (e.includes('PROPOSTA')) return 'PROPOSTA';
  if (e.includes('PRODUCAO') || e.includes('ONBOARDING')) return 'PRODUCAO';
  if (e.includes('FECHADO') || e.includes('GANHO')) return 'FECHADO';
  if (e.includes('PERDIDO')) return 'PERDIDO';
  return 'PROSPECCAO';
}

function sanitizePrioridade(prioridade: any): string {
  const p = String(prioridade || '').toUpperCase();
  if (p.includes('URGENTE')) return 'URGENTE';
  if (p.includes('ALTA')) return 'ALTA';
  if (p.includes('BAIXA')) return 'BAIXA';
  return 'MEDIA';
}

function sanitizeStatus(status: any): string {
  const s = String(status || '').toUpperCase();
  if (s.includes('PENDENTE')) return 'PENDENTE_ANUNCIO';
  if (s.includes('ANUNCIADO')) return 'ANUNCIADO';
  if (s.includes('VENDIDO')) return 'VENDIDO';
  if (s.includes('DEVOLVIDO')) return 'DEVOLVIDO';
  return 'COMPRADO_PREPARACAO';
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPT_DISPATCHER = (hoje: string) => `Você é o cérebro central do Saldo AI / CRM Multi-Workspace.
Analise a mensagem ou áudio transcrito e identifique qual dos 3 workspaces o comando pertence:

1. GSTORE (Produtos para revenda, compras de eletrônicos/mercadorias para a loja, estoque):
   - Ex: "Comprei um notebook Dell Inspiron 15 i5 11ª geração por 1.800 para vender na loja"
   - Retorne tipo: "GSTORE_PRODUTO"
   - Extraia custo de aquisição, marca, modelo, especificações técnicas, título chamativo para OLX e descrição de anúncio.
   - Calcule preço de venda sugerido (benchmark com margem saudável de 30-50%).

2. PWLABS (B2B / Agência, clientes, reuniões, propostas, contratos de tráfego/landing page):
   - Ex: "Reunião com Dr. Marcos da clínica Sorrir fechou proposta de 4.500 no tráfego pago"
   - Retorne tipo: "PWLABS_DEAL"

3. PESSOAL (Finanças pessoais, alimentação, combustível, contas de casa OU tarefas do dia):
   - Se for financeiro (ex: "Almoço 47,30"): Retorne tipo: "PESSOAL_FINANCE".
   - Se for lembrete/tarefa (ex: "Lembrar de pagar a luz às 16h"): Retorne tipo: "PESSOAL_TAREFA".

Data de referência: ${hoje}

FORMATO DE RESPOSTA (JSON STRICT):
{
  "transcricao": "o que foi falado/escrito",
  "tipo": "GSTORE_PRODUTO" | "PWLABS_DEAL" | "PESSOAL_FINANCE" | "PESSOAL_TAREFA",
  "confianca": 0.95,
  "dados": {
    // Para GSTORE_PRODUTO:
    "produto": {
      "titulo": "Notebook Dell Inspiron 15 5590 Core i5 11ª Geração",
      "marca": "Dell",
      "modelo": "Inspiron 15 5590",
      "categoria": "Eletrônicos",
      "condicao": "USADO_EXCELENTE",
      "custo_aquisicao": 1800.00,
      "preco_sugerido_min": 2200.00,
      "preco_sugerido_max": 2700.00,
      "margem_estimada_perc": 35.00,
      "especificacoes": {"processador": "Intel Core i5-1135G7", "ram": "8GB", "ssd": "256GB"},
      "descricao_anuncio": "Descrição otimizada para OLX...",
      "data_aquisicao": "${hoje}"
    },
    // Para PWLABS_DEAL:
    "deal": {
      "titulo_deal": "Projeto Trafego - Clinica Sorrir",
      "empresa": "Clinica Sorrir",
      "contato_nome": "Dr. Marcos",
      "valor_estimado": 4500.00,
      "estagio": "PROPOSTA",
      "servicos": ["Trafego Pago", "Google Ads"],
      "proxima_acao": "Enviar proposta comercial"
    },
    // Para PESSOAL_FINANCE:
    "transacao": {
      "descricao": "Almoço",
      "valor": 47.30,
      "tipo": "SAIDA_PAGA",
      "categoria": "Alimentação",
      "forma_pagamento": "PIX"
    },
    // Para PESSOAL_TAREFA:
    "tarefa": {
      "titulo": "Pagar conta de luz",
      "descricao": "Pagar a conta de luz que vence amanhã",
      "prioridade": "ALTA",
      "data_limite": "2025-09-03",
      "horario": "16:00"
    }
  }
}`;

const SYSTEM_PROMPT_FINANCE = (hoje: string) => `Você é o Saldo AI, um assistente inteligente de gestão financeira pessoal no Brasil.
Sua missão é extrair transações financeiras com precisão matemática e categorização a partir de mensagens informais de texto ou transcrições de áudio.

Data atual de referência: ${hoje}

REGRAS DE NEGÓCIO:
1. tipo (OBRIGATÓRIO usar exatamente uma destas strings):
   - 'ENTRADA': Recebimentos, vendas, salário, pro-labore, Pix recebido, reembolso, comissão.
   - 'SAIDA_PAGA': Compras ou despesas já pagas no momento (Pix, Débito, Dinheiro).
   - 'SAIDA_PENDENTE': Contas a pagar no futuro, faturas de cartão de crédito a vencer, boletos futuros.

2. forma_pagamento (OBRIGATÓRIO usar exatamente uma destas strings):
   - 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO'.
   - Se não for especificado em compras cotidianas, assuma 'PIX' ou 'DEBITO'.
   - Se for parcelado ou fatura de cartão, assuma 'CREDITO'.

3. CÁLCULOS E DIVISÕES DE CONTA (MUITO IMPORTANTE):
   - Se o usuário mencionar divisões ou acertos (ex: "Bk 47,30 sendo que 19 o Kajan passou"):
     * Calcule o valor líquido real gasto pelo usuário: 47.30 - 19.00 = 28.30.
     * Coloque o valor líquido no campo valor.
     * Guarde a mensagem original no campo observacao.
   - Se falar "vendi 2 whey por 178 no pix":
     * valor: 178.00, tipo: 'ENTRADA', categoria: 'Vendas / Renda Extra', forma_pagamento: 'PIX'.

4. Categorias Padronizadas:
   - 'Alimentação', 'Mercado', 'Transporte', 'Moradia', 'Salário', 'Vendas / Renda Extra', 'Cartão de Crédito', 'Lazer', 'Saúde', 'Educação', 'Assinaturas', 'Outros'.

5. Múltiplas transações:
   - Se houver mais de um lançamento, retorne todos no array 'transacoes'.

FORMATO DE RESPOSTA (JSON STRICT):
{
  "transcricao": "transcrição do que foi falado/escrito",
  "transacoes": [
    {
      "descricao": "Burger King",
      "valor": 28.30,
      "tipo": "SAIDA_PAGA",
      "categoria": "Alimentação",
      "forma_pagamento": "DEBITO",
      "observacao": "Bk 47,30 sendo que 19 o Kajan passou",
      "data_transacao": "${hoje}",
      "data_vencimento": null
    }
  ]
}`;

// ============================================
// MAIN EXTRACTOR FUNCTION (DISPATCHER)
// ============================================

export async function classifyAndExtract(input: string): Promise<ResultadoClassificacao> {
  const { client, textModel } = getAIClient();
  const hoje = new Date().toISOString().split('T')[0];

  const response = await client.chat.completions.create({
    model: textModel,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_DISPATCHER(hoje) },
      { role: 'user', content: input },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  const tipo = parsed.tipo as TipoIntento;
  const confianca = Number(parsed.confianca) || 0.8;
  const dados = parsed.dados || {};

  // Processa dados conforme o tipo
  let dadosProcessados: ResultadoClassificacao['dados'] = {};

  if (tipo === 'GSTORE_PRODUTO' && dados.produto) {
    const p = dados.produto;
    const custo = parseSafeNumber(p.custo_aquisicao, 0) || 0;
    const margem = parseSafeNumber(p.margem_estimada_perc, 35) || 35;
    const precoMin = parseSafeNumber(p.preco_sugerido_min, custo > 0 ? Math.round(custo * 1.25) : null);
    const precoMax = parseSafeNumber(p.preco_sugerido_max, custo > 0 ? Math.round(custo * 1.5) : null);

    dadosProcessados.produto = {
      titulo: p.titulo || 'Produto G-Store',
      marca: p.marca || null,
      modelo: p.modelo || null,
      categoria: p.categoria || 'Eletrônicos',
      condicao: sanitizeCondicao(p.condicao) as any,
      custo_aquisicao: custo,
      preco_sugerido_min: precoMin,
      preco_sugerido_max: precoMax,
      margem_estimada_perc: margem,
      especificacoes: typeof p.especificacoes === 'object' && p.especificacoes !== null ? p.especificacoes : {},
      descricao_anuncio: p.descricao_anuncio || null,
      data_aquisicao: p.data_aquisicao || hoje,
    };
  } else if (tipo === 'PWLABS_DEAL' && dados.deal) {
    const d = dados.deal;
    dadosProcessados.deal = {
      titulo_deal: d.titulo_deal || d.empresa || 'Novo Deal',
      empresa: d.empresa || null,
      contato_nome: d.contato_nome || 'Lead',
      contato_telefone: d.contato_telefone || null,
      contato_email: d.contato_email || null,
      valor_estimado: parseSafeNumber(d.valor_estimado, 0) || 0,
      estagio: sanitizeEstagio(d.estagio) as any,
      servicos: Array.isArray(d.servicos) ? d.servicos : [],
      proxima_acao: d.proxima_acao || null,
      data_proxima_acao: d.data_proxima_acao || null,
      notas: d.notas || null,
    };
  } else if (tipo === 'PESSOAL_FINANCE' && dados.transacao) {
    const t = dados.transacao;
    dadosProcessados.transacao = {
      descricao: t.descricao || 'Despesa',
      valor: Math.abs(parseSafeNumber(t.valor, 0) || 0),
      tipo: sanitizeTipo(t.tipo) as any,
      categoria: t.categoria || 'Outros',
      forma_pagamento: sanitizeForma(t.forma_pagamento) as any,
    };
  } else if (tipo === 'PESSOAL_TAREFA' && dados.tarefa) {
    const tar = dados.tarefa;
    dadosProcessados.tarefa = {
      titulo: tar.titulo || 'Nova Tarefa',
      descricao: tar.descricao || null,
      prioridade: sanitizePrioridade(tar.prioridade) as any,
      data_limite: tar.data_limite || null,
      horario: tar.horario || null,
    };
  }

  return {
    tipo: tipo || 'PESSOAL_FINANCE',
    confianca,
    dados: dadosProcessados,
  };
}

// ============================================
// LEGACY FUNCTIONS (RETROCOMPATIBILIDADE)
// ============================================

export async function extractTransactionsFromText(text: string): Promise<NovaTransacaoInput[]> {
  const { client, textModel } = getAIClient();
  const hoje = new Date().toISOString().split('T')[0];

  const response = await client.chat.completions.create({
    model: textModel,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_FINANCE(hoje) },
      { role: 'user', content: text },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  if (!parsed.transacoes || !Array.isArray(parsed.transacoes) || parsed.transacoes.length === 0) {
    throw new Error('A IA não conseguiu identificar nenhuma transação na mensagem fornecida.');
  }

  return parsed.transacoes.map((t: any) => ({
    descricao: String(t.descricao || 'Despesa/Receita'),
    valor: Math.abs(Number(t.valor) || 0),
    tipo: sanitizeTipo(t.tipo),
    categoria: String(t.categoria || 'Outros'),
    forma_pagamento: sanitizeForma(t.forma_pagamento),
    observacao: t.observacao ? String(t.observacao) : null,
    data_transacao: t.data_transacao || hoje,
    data_vencimento: t.data_vencimento || null,
  }));
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  const { client, isOpenRouter, audioModel } = getAIClient();

  if (isOpenRouter) {
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const response = await client.chat.completions.create({
      model: audioModel,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcreva exatamente o que foi falado neste áudio em português do Brasil. Retorne APENAS o texto puro transcrito, sem aspas e sem explicações.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ] as any,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    if (!text) {
      throw new Error('Não foi possível identificar o que foi dito no áudio. Fale um pouco mais perto do microfone.');
    }
    return text;
  }

  // Caso OpenAI tradicional: Whisper
  const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'pt',
  });

  return transcription.text;
}

export async function processAudioFile(audioFile: File): Promise<{ rawText: string; transacoes: NovaTransacaoInput[] }> {
  const rawText = await transcribeAudio(audioFile);
  let transacoes: NovaTransacaoInput[] = [];
  try {
    transacoes = await extractTransactionsFromText(rawText);
  } catch {
    transacoes = [];
  }
  return { rawText, transacoes };
}

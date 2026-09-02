import OpenAI from 'openai';
import { NovaTransacaoInput, TipoTransacao, FormaPagamento } from '@/types/finance';

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

export async function processAudioFile(audioFile: File): Promise<{ rawText: string; transacoes: NovaTransacaoInput[] }> {
  const { client, isOpenRouter, audioModel, textModel } = getAIClient();
  const hoje = new Date().toISOString().split('T')[0];

  // Caso OpenRouter: Enviar áudio multimodal para Gemini 2.5 Flash
  if (isOpenRouter) {
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const response = await client.chat.completions.create({
      model: audioModel,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_FINANCE(hoje) },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Ouça atentamente este áudio em português. Transcreva exatamente o que foi dito no campo "transcricao" e extraia todas as transações financeiras no array "transacoes".',
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

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const rawText = parsed.transcricao || 'Áudio processado por voz';

    if (!parsed.transacoes || !Array.isArray(parsed.transacoes) || parsed.transacoes.length === 0) {
      throw new Error('Não foi possível identificar transações no áudio gravado.');
    }

    const transacoes: NovaTransacaoInput[] = parsed.transacoes.map((t: any) => ({
      descricao: String(t.descricao || 'Despesa/Receita'),
      valor: Math.abs(Number(t.valor) || 0),
      tipo: sanitizeTipo(t.tipo),
      categoria: String(t.categoria || 'Outros'),
      forma_pagamento: sanitizeForma(t.forma_pagamento),
      observacao: t.observacao ? String(t.observacao) : null,
      data_transacao: t.data_transacao || hoje,
      data_vencimento: t.data_vencimento || null,
    }));

    return { rawText, transacoes };
  }

  // Caso OpenAI tradicional: Whisper + Text
  const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'pt',
    prompt: 'Finanças pessoais, nomes de estabelecimentos, Pix, débito, crédito, compras',
  });

  const rawText = transcription.text;
  const transacoes = await extractTransactionsFromText(rawText);
  return { rawText, transacoes };
}

// Retrocompatibilidade
export async function transcribeAudio(audioFile: File): Promise<string> {
  const res = await processAudioFile(audioFile);
  return res.rawText;
}

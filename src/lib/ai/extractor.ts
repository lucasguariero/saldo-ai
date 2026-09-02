import OpenAI from 'openai';
import { NovaTransacaoInput } from '@/types/finance';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não está configurada no ambiente (.env.local).');
  }
  return new OpenAI({ apiKey });
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  const openai = getOpenAIClient();
  
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'pt',
    prompt: 'Finanças pessoais, nomes de estabelecimentos, Pix, débito, crédito, Burger King, Nubank, Whey, compras',
  });

  return transcription.text;
}

export async function extractTransactionsFromText(text: string): Promise<NovaTransacaoInput[]> {
  const openai = getOpenAIClient();
  const hoje = new Date().toISOString().split('T')[0];

  const systemPrompt = `Você é o Kora, um assistente inteligente de gestão financeira pessoal no Brasil.
Sua missão é extrair transações financeiras com precisão matemática e categorização a partir de mensagens informais de texto ou transcrições de áudio.

Data atual de referência: ${hoje}

REGRAS DE NEGÓCIO:
1. tipo:
   - 'ENTRADA': Recebimentos, vendas, salário, pro-labore, Pix recebido, reembolso, comissão.
   - 'SAIDA_PAGA': Compras ou despesas já pagas no momento (Pix, Débito, Dinheiro).
   - 'SAIDA_PENDENTE': Contas a pagar no futuro, faturas de cartão de crédito a vencer, boletos futuros.

2. forma_pagamento:
   - 'PIX' | 'DEBITO' | 'CREDITO' | 'DINHEIRO'.
   - Se não for especificado em compras imediatas, assuma 'PIX' ou 'DEBITO'.
   - Se for parcelado ou fatura, assuma 'CREDITO'.

3. CÁLCULOS E DIVISÕES DE CONTA (MUITO IMPORTANTE):
   - Se o usuário mencionar divisões ou acertos (ex: "Bk 47,30 sendo que 19 o Kajan passou"):
     * Calcule o valor líquido real gasto pelo usuário: 47.30 - 19.00 = 28.30.
     * Coloque 28.30 no campo valor.
     * Guarde a mensagem original e explicação no campo observacao (ex: "Bk 47,30 sendo que 19 o Kajan passou (líquido R$ 28,30)").
   - Se falar "vendi 2 whey por 178 no pix":
     * valor: 178.00, tipo: 'ENTRADA', categoria: 'Vendas / Renda Extra', forma_pagamento: 'PIX'.

4. Categorias Padronizadas:
   - 'Alimentação' (restaurante, lanches, delivery, iFood, padaria)
   - 'Mercado' (supermercado, atacado, feira)
   - 'Transporte' (gasolina, Uber, 99, estacionamento)
   - 'Moradia' (aluguel, condomínio, luz, internet)
   - 'Salário' (salário, pro-labore)
   - 'Vendas / Renda Extra' (produtos vendidos, freelances)
   - 'Cartão de Crédito' (faturas)
   - 'Lazer' (viagens, cinema, festas, jogos)
   - 'Saúde' (farmácia, suplementos, academia, médico)
   - 'Educação' (cursos, livros)
   - 'Assinaturas' (softwares, streaming)
   - 'Outros'

5. Múltiplas transações:
   - Se o usuário falar dois ou mais gastos/entradas na mesma mensagem (ex: "gastei 50 no posto e 30 no almoço"), retorne um array com todas as transações separadas.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON):
{
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
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
    valor: Number(t.valor) || 0,
    tipo: t.tipo || 'SAIDA_PAGA',
    categoria: String(t.categoria || 'Outros'),
    forma_pagamento: t.forma_pagamento || 'PIX',
    observacao: t.observacao ? String(t.observacao) : null,
    data_transacao: t.data_transacao || hoje,
    data_vencimento: t.data_vencimento || null,
  }));
}

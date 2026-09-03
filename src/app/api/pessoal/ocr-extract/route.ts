import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface OCRRequest {
  imagem_base64: string;
}

interface TransacaoExtraida {
  id_temp: string;
  descricao: string;
  valor: number;
  tipo: 'SAIDA_PAGA' | 'SAIDA_PENDENTE' | 'ENTRADA';
  data_transacao: string;
  categoria: string;
  forma_pagamento: 'PIX' | 'CREDITO' | 'DEBITO' | 'BOLETO';
  confianca: number;
}

interface OCRResponse {
  transacoes: TransacaoExtraida[];
}

export async function POST(req: NextRequest) {
  try {
    const body: OCRRequest = await req.json();
    const { imagem_base64 } = body;

    if (!imagem_base64) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória' },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um assistente especializado em extração de dados financeiros de extratos bancários, faturas de cartão de crédito e cupons fiscais.

Analise a imagem de extrato/fatura e extraia TODAS as transações identificadas.

Para cada transação, retorne:
- descricao: Nome do estabelecimento ou descrição da transação
- valor: Valor numérico POSITIVO (não use negativo)
- tipo: "ENTRADA" para créditos/depósitos, "SAIDA_PAGA" para débitos já pagos, "SAIDA_PENDENTE" para débitos ainda não pagos
- data_transacao: Data no formato YYYY-MM-DD
- categoria: Categoria da transação (ex: ALIMENTAÇÃO, TRANSPORTE, SALÁRIO, LUZ, ÁGUA, INTERNET, COMPRAS, etc)
- forma_pagamento: Uma das opções: PIX, CREDITO, DEBITO, BOLETO
- confianca: Número de 0 a 1 indicando sua confiança na extração

Retorne APENAS um JSON com formato:
{
  "transacoes": [
    {
      "id_temp": "uuid ou identificador único",
      "descricao": "...",
      "valor": 100.00,
      "tipo": "SAIDA_PAGA",
      "data_transacao": "2024-01-15",
      "categoria": "ALIMENTAÇÃO",
      "forma_pagamento": "PIX",
      "confianca": 0.95
    }
  ]
}

Se não houver transações claras na imagem, retorne um array vazio.
não invente dados se não conseguir identificar.`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Saldo AI - OCR Financeiro',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraia todas as transações deste extrato/fatura:' },
              { type: 'image_url', image_url: { url: imagem_base64 } }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Erro ao processar imagem com a IA' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parsear JSON da resposta
    let result: OCRResponse = { transacoes: [] };

    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.transacoes && Array.isArray(parsed.transacoes)) {
          result.transacoes = parsed.transacoes;
        }
      }
    } catch (parseError) {
      console.error('Error parsing OCR response:', parseError);
      // Retornar array vazio em caso de erro de parse
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ocr-extract:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

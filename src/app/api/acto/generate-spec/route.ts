import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuração do OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface GenerateSpecRequest {
  projeto: string;
  prompt_briefing: string;
  imagem_base64?: string;
  engine: 'gemini' | 'claude';
}

interface GenerateSpecResponse {
  especificacao_markdown: string;
  codigo_tailwind?: string;
  prompt_google_stitch?: string;
  prompt_figma?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateSpecRequest = await req.json();
    const { projeto, prompt_briefing, imagem_base64, engine } = body;

    if (!projeto || !prompt_briefing) {
      return NextResponse.json(
        { error: 'Projeto e prompt_briefing são obrigatórios' },
        { status: 400 }
      );
    }

    // Selecionar modelo baseado na engine
    const model = engine === 'claude'
      ? 'anthropic/claude-3.5-sonnet'
      : 'google/gemini-2.5-flash';

    // Montar o prompt do sistema
    const systemPrompt = `Você é um especialista em UI/UX Design e Frontend Development.
Analise a solicitação de design e gere:

1. **Especificação em Markdown**: Descrição detalhada dos componentes de UI necessários, incluindo layout, cores, tipografia, espaçamento e comportamento interativo.

2. **Código Tailwind CSS**: Trecho de código JSX com classes Tailwind prontas para copiar e usar em um projeto React/Next.js.

3. **Prompt para Google Stitch**: Prompt otimizado para gerar o design automaticamente no Google Stitch.

4. **Prompt para Figma**: Prompt otimizado para usar em plugins de IA do Figma (como Magicul, Locofy, ou outros).

Sempre responda em português brasileiro. Seja específico e detalhado.`;

    // Construir a mensagem do usuário
    let userMessage = `Projeto: ${projeto}\n\nBriefing: ${prompt_briefing}`;

    // Se tiver imagem base64, incluir como parte da mensagem
    if (imagem_base64) {
      userMessage += `\n\nHá uma imagem de referência anexa (print de tela).`;
    }

    // Fazer a chamada para o OpenRouter
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Saldo AI - Acto Design Spec Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: imagem_base64
              ? [
                  { type: 'text', text: userMessage },
                  { type: 'image_url', image_url: { url: imagem_base64 } }
                ]
              : userMessage
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Erro ao gerar especificação com a IA' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parsear a resposta para extrair as partes
    // A IA deve retornar em formato estruturado
    let result: GenerateSpecResponse;

    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // Se não encontrar JSON formatado, dividir por seções
        const especificacaoMatch = content.match(/##\s*Especificação[\s\S]*?(?=##|$)/i);
        const codigoMatch = content.match(/##\s*Código[\s\S]*?(?=##|$)/i);
        const stitchMatch = content.match(/##\s*Google Stitch[\s\S]*?(?=##|$)/i);
        const figmaMatch = content.match(/##\s*Figma[\s\S]*?(?=##|$)/i);

        result = {
          especificacao_markdown: especificacaoMatch ? especificacaoMatch[0].replace(/##\s*Especificação\s*/i, '').trim() : content,
          codigo_tailwind: codigoMatch ? codigoMatch[0].replace(/##\s*Código[\s\S]*?```(?:jsx|tsx)?\n?/i, '').replace(/```$/, '').trim() : undefined,
          prompt_google_stitch: stitchMatch ? stitchMatch[0].replace(/##\s*Google Stitch\s*/i, '').trim() : undefined,
          prompt_figma: figmaMatch ? figmaMatch[0].replace(/##\s*Figma\s*/i, '').trim() : undefined,
        };
      }
    } catch (parseError) {
      // Se falhar o parse, retornar o conteúdo inteiro como especificação
      result = {
        especificacao_markdown: content,
      };
    }

    // Garantir que temos pelo menos a especificação
    if (!result.especificacao_markdown) {
      result.especificacao_markdown = content;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in generate-spec:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

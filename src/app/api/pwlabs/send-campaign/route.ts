import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SendCampaignRequest {
  campanha_id?: string;
  asunto: string;
  conteudo_html: string;
  destinatarios: string[];
  nome_remetente?: string;
  email_remetente?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const body: SendCampaignRequest = await req.json();
    const { asunto, conteudo_html, destinatarios, nome_remetente, email_remetente } = body;

    if (!asunto || !conteudo_html || !destinatarios || destinatarios.length === 0) {
      return NextResponse.json(
        { error: 'Assunto, conteúdo e destinatários são obrigatórios' },
        { status: 400 }
      );
    }

    // Configuração do remetente
    const from = email_remetente
      ? `${nome_remetente || 'Saldo AI'} <${email_remetente}>`
      : 'Saldo AI <noreply@saldoai.com.br>';

    // Enviar e-mails em lote (Resend permite até 100 por batch)
    const resultados = [];
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < destinatarios.length; i += batchSize) {
      batches.push(destinatarios.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      // Enviar cada e-mail individualmente para personalização
      for (const email of batch) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from,
              to: email,
              subject: asunto,
              html: conteudo_html,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Resend API error:', errorData);
            resultados.push({ email, success: false, error: errorData.message });
          } else {
            const data = await response.json();
            resultados.push({ email, success: true, id: data.id });
          }
        } catch (error) {
          console.error('Error sending email:', error);
          resultados.push({ email, success: false, error: 'Erro ao enviar' });
        }
      }
    }

    const totalEnviados = resultados.filter(r => r.success).length;
    const totalErros = resultados.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total_enviados: totalEnviados,
      total_erros: totalErros,
      resultados: resultados.slice(0, 10), // Retornar apenas os primeiros 10 para não sobrecarregar
    });
  } catch (error) {
    console.error('Error in send-campaign:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, extractTransactionsFromText } from '@/lib/ai/extractor';
import { createClient } from '@/lib/supabase/server';
import { NovaTransacaoInput } from '@/types/finance';

export async function POST(req: NextRequest) {
  try {
    let rawText = '';
    const contentType = req.headers.get('content-type') || '';

    // 1. Processar se for FormData (áudio ou texto)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File | null;
      const textParam = formData.get('text') as string | null;

      if (audioFile && audioFile.size > 0) {
        // Transcrever áudio via Whisper
        rawText = await transcribeAudio(audioFile);
      } else if (textParam) {
        rawText = textParam;
      }
    } 
    // 2. Processar se for JSON direto
    else if (contentType.includes('application/json')) {
      const body = await req.json();
      rawText = body.text || '';
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nenhum áudio ou texto foi fornecido.' },
        { status: 400 }
      );
    }

    // 3. Extrair transações com LLM
    const transacoes: NovaTransacaoInput[] = await extractTransactionsFromText(rawText);

    // 4. Inserir no Supabase
    let insertedRecords = transacoes;
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('transacoes')
        .insert(transacoes as any)
        .select();

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
      } else if (data) {
        insertedRecords = data as any;
      }
    } catch (dbErr) {
      console.warn('Não foi possível conectar ao Supabase (atualização local):', dbErr);
    }

    return NextResponse.json({
      success: true,
      rawText,
      transacoes: insertedRecords,
      message: `${transacoes.length} transação(ões) processada(s) com sucesso!`,
    });
  } catch (error: any) {
    console.error('Erro em process-transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Ocorreu um erro ao processar a transação.',
      },
      { status: 500 }
    );
  }
}

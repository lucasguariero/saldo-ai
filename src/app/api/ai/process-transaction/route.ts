import { NextRequest, NextResponse } from 'next/server';
import { processAudioFile, extractTransactionsFromText } from '@/lib/ai/extractor';
import { createClient } from '@/lib/supabase/server';
import { NovaTransacaoInput } from '@/types/finance';

export async function POST(req: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Serviço de banco de dados não disponível.' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    let rawText = '';
    let transacoes: NovaTransacaoInput[] = [];
    const contentType = req.headers.get('content-type') || '';

    // 1. Processar se for FormData (áudio ou texto)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File | null;
      const textParam = formData.get('text') as string | null;

      if (audioFile && audioFile.size > 0) {
        // Processar áudio diretamente (Whisper ou Gemini Multimodal)
        const audioResult = await processAudioFile(audioFile);
        rawText = audioResult.rawText;
        transacoes = audioResult.transacoes;
      } else if (textParam) {
        rawText = textParam;
        transacoes = await extractTransactionsFromText(rawText);
      }
    } 
    // 2. Processar se for JSON direto (texto)
    else if (contentType.includes('application/json')) {
      const body = await req.json();
      rawText = body.text || '';
      if (rawText.trim()) {
        transacoes = await extractTransactionsFromText(rawText);
      }
    }

    if (!rawText.trim() || transacoes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum áudio ou texto válido foi fornecido.' },
        { status: 400 }
      );
    }

    // 3. Inserir no Supabase com user_id
    let insertedRecords = transacoes;
    try {
      const transacoesComUserId = transacoes.map(t => ({
        ...t,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('transacoes')
        .insert(transacoesComUserId as any)
        .select();

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
      } else if (data) {
        insertedRecords = data as any;
      }
    } catch (dbErr) {
      console.warn('Erro ao conectar ao Supabase:', dbErr);
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
